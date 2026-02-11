import { userRepository } from "@/repositories/user.repository";
import type {
  RegisterInput,
  LoginInput,
  VerifyEmailInput,
  RefreshTokenInput,
  ForgotPasswordInput,
  ResetPasswordInput,
} from "@/schemas/auth.schema";
import { auditService } from "@/services/audit.service";
import { emailService } from "@/services/email.service";
import { AuditActions } from "@/types/audit.types";
import { AppError } from "@/utils/errors";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  ACCESS_TOKEN_EXPIRY_SECONDS,
} from "@/utils/jwt";
import { logger } from "@/utils/logger";
import { hashPassword, verifyPassword } from "@/utils/password";
import { generateRandomToken, getTokenExpiration } from "@/utils/token";

/**
 * Authentication service handling all auth-related business logic
 */
export class AuthService {
  /**
   * Registers a new user account
   */
  async register(input: RegisterInput) {
    const { email, password, name } = input;

    // Check if user already exists
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      throw new AppError("Email already registered", 409, "DUPLICATE_EMAIL");
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await userRepository.create({
      email,
      password: hashedPassword,
      name,
    });

    // Generate email verification token
    const verificationToken = generateRandomToken(32);
    await userRepository.createEmailVerificationToken(user.id, verificationToken);

    // Audit log
    auditService.log({
      actorId: user.id,
      actorType: "user",
      action: AuditActions.USER_REGISTERED,
      resourceType: "user",
      resourceId: user.id,
      metadata: { email: user.email },
    });

    // Queue verification email
    await emailService.sendVerificationEmail(user.email, verificationToken);

    logger.info(
      {
        userId: user.id,
        email: user.email,
      },
      "User registered - verification email queued"
    );

    return {
      message: "Registration successful. Check your email for verification instructions.",
    };
  }

  /**
   * Verifies user email with token
   */
  async verifyEmail(input: VerifyEmailInput) {
    const { token } = input;

    const user = await userRepository.verifyEmail(token);

    if (!user) {
      throw new AppError("Invalid or expired verification token", 400, "INVALID_TOKEN");
    }

    logger.info({ userId: user.id, email: user.email }, "Email verified");

    return {
      message: "Email verified successfully. You can now log in.",
    };
  }

  /**
   * Authenticates user and returns tokens
   */
  async login(input: LoginInput, ipAddress?: string, userAgent?: string) {
    const { email, password } = input;

    // Find user by email
    const user = await userRepository.findByEmail(email);
    if (!user || !user.password) {
      // Audit failed login attempt
      auditService.log({
        actorType: "user",
        action: AuditActions.USER_LOGIN_FAILED,
        metadata: { email, reason: "user_not_found" },
        ipAddress,
        userAgent,
      });
      throw new AppError("Invalid credentials", 401, "INVALID_CREDENTIALS");
    }

    // Verify password
    const isPasswordValid = await verifyPassword(password, user.password);
    if (!isPasswordValid) {
      // Audit failed login attempt
      auditService.log({
        actorId: user.id,
        actorType: "user",
        action: AuditActions.USER_LOGIN_FAILED,
        metadata: { email, reason: "invalid_password" },
        ipAddress,
        userAgent,
      });
      throw new AppError("Invalid credentials", 401, "INVALID_CREDENTIALS");
    }

    // Check if email is verified
    if (!user.emailVerified) {
      throw new AppError(
        "Email not verified. Check your inbox for verification link.",
        403,
        "EMAIL_NOT_VERIFIED"
      );
    }

    // Create session
    const refreshTokenExpiry = getTokenExpiration(24 * 7); // 7 days
    const session = await userRepository.createSession({
      userId: user.id,
      refreshToken: "temp", // Will be updated below
      expiresAt: refreshTokenExpiry,
      ipAddress,
      userAgent,
    });

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: user.id,
    });

    const refreshToken = generateRefreshToken({
      userId: user.id,
      sessionId: session.id,
    });

    // Update session with actual refresh token
    await userRepository.updateSessionToken(session.id, refreshToken, refreshTokenExpiry);

    // Audit log
    auditService.log({
      actorId: user.id,
      actorType: "user",
      action: AuditActions.USER_LOGIN,
      resourceType: "session",
      resourceId: session.id,
      ipAddress,
      userAgent,
    });

    logger.info(
      {
        userId: user.id,
        sessionId: session.id,
        ipAddress,
      },
      "User logged in"
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: ACCESS_TOKEN_EXPIRY_SECONDS,
    };
  }

  /**
   * Refreshes access token using refresh token
   */
  async refresh(input: RefreshTokenInput) {
    const { refreshToken } = input;

    // Verify refresh token signature
    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) {
      throw new AppError("Invalid refresh token", 401, "INVALID_TOKEN");
    }

    // Find session
    const session = await userRepository.findSession(decoded.sessionId);
    if (!session) {
      throw new AppError("Session not found", 401, "SESSION_NOT_FOUND");
    }

    // Check if session is revoked
    if (session.revokedAt) {
      throw new AppError("Session revoked", 401, "SESSION_REVOKED");
    }

    // Check if session is expired
    if (session.expiresAt < new Date()) {
      throw new AppError("Session expired", 401, "SESSION_EXPIRED");
    }

    // Check for token reuse (security: if old token is reused, revoke session)
    if (session.refreshToken !== refreshToken) {
      logger.warn(
        {
          userId: session.userId,
          sessionId: session.id,
        },
        "Refresh token reuse detected - revoking session"
      );

      await userRepository.revokeSession(session.id);
      throw new AppError("Token reuse detected. Session revoked.", 401, "TOKEN_REUSE");
    }

    // Generate new token pair
    const newAccessToken = generateAccessToken({
      userId: session.userId,
    });

    const newRefreshToken = generateRefreshToken({
      userId: session.userId,
      sessionId: session.id,
    });

    const newExpiry = getTokenExpiration(24 * 7);

    // Update session with new refresh token (rotation)
    await userRepository.updateSessionToken(session.id, newRefreshToken, newExpiry);

    logger.info(
      {
        userId: session.userId,
        sessionId: session.id,
      },
      "Token refreshed"
    );

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresIn: ACCESS_TOKEN_EXPIRY_SECONDS,
    };
  }

  /**
   * Initiates password reset flow
   */
  async forgotPassword(input: ForgotPasswordInput) {
    const { email } = input;

    // Generate reset token
    const resetToken = generateRandomToken(32);

    // Create password reset record (fails silently if user doesn't exist)
    await userRepository.createPasswordResetToken(email, resetToken);

    // Queue password reset email
    await emailService.sendPasswordResetEmail(email, resetToken);

    logger.info(
      {
        email,
      },
      "Password reset requested"
    );

    // Always return success to prevent user enumeration
    return {
      message: "If an account exists with that email, a password reset link has been sent.",
    };
  }

  /**
   * Resets user password with token
   */
  async resetPassword(input: ResetPasswordInput) {
    const { token, password } = input;

    // Find valid reset token
    const resetRecord = await userRepository.findPasswordResetToken(token);
    if (!resetRecord) {
      throw new AppError("Invalid or expired reset token", 400, "INVALID_TOKEN");
    }

    // Hash new password
    const hashedPassword = await hashPassword(password);

    // Update user password
    await userRepository.updatePassword(resetRecord.userId, hashedPassword);

    // Mark token as used
    await userRepository.markPasswordResetTokenUsed(resetRecord.id);

    // Revoke all existing sessions (force re-login)
    await userRepository.revokeAllUserSessions(resetRecord.userId);

    logger.info(
      {
        userId: resetRecord.userId,
        email: resetRecord.user.email,
      },
      "Password reset successfully"
    );

    return {
      message: "Password reset successfully. You can now log in with your new password.",
    };
  }
}

export const authService = new AuthService();
