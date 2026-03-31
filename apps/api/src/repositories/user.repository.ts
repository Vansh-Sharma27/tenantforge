import { createHash } from "crypto";

import { User } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { getTokenExpiration } from "@/utils/token";

/**
 * User repository for database operations
 */
export class UserRepository {
  /**
   * Finds a user by email address
   */
  async findByEmail(email: string): Promise<User | null> {
    return await prisma.user.findUnique({
      where: { email },
    });
  }

  /**
   * Finds a user by ID
   */
  async findById(id: string): Promise<User | null> {
    return await prisma.user.findUnique({
      where: { id },
    });
  }

  /**
   * Creates a new user with hashed password
   */
  async create(data: { email: string; password: string; name: string }): Promise<User> {
    return await prisma.user.create({
      data: {
        email: data.email,
        password: data.password,
        name: data.name,
        emailVerified: false,
      },
    });
  }

  /**
   * Creates an email verification token for a user
   */
  async createEmailVerificationToken(userId: string, token: string): Promise<void> {
    const expiresAt = getTokenExpiration(24); // 24 hours
    const hashedToken = createHash("sha256").update(token).digest("hex");

    await prisma.user.update({
      where: { id: userId },
      data: {
        emailVerificationToken: hashedToken,
        emailVerificationExpiry: expiresAt,
      },
    });
  }

  /**
   * Verifies user email using verification token
   */
  async verifyEmail(token: string): Promise<User | null> {
    // Hash the incoming token to compare against stored hash
    const hashedToken = createHash("sha256").update(token).digest("hex");

    // Find user with matching token
    const user = await prisma.user.findFirst({
      where: {
        emailVerificationToken: hashedToken,
        emailVerificationExpiry: {
          gt: new Date(), // Token not expired
        },
      },
    });

    if (!user) {
      return null;
    }

    // Update user as verified and clear token
    return await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpiry: null,
      },
    });
  }

  /**
   * Updates user password
   */
  async updatePassword(userId: string, hashedPassword: string): Promise<User> {
    return await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });
  }

  /**
   * Creates a password reset token
   */
  async createPasswordResetToken(email: string, token: string): Promise<void> {
    const expiresAt = getTokenExpiration(1); // 1 hour

    const user = await this.findByEmail(email);
    if (!user) {
      return; // Silently fail to prevent user enumeration
    }

    const hashedToken = createHash("sha256").update(token).digest("hex");

    await prisma.passwordReset.create({
      data: {
        userId: user.id,
        token: hashedToken,
        expiresAt,
      },
    });
  }

  /**
   * Finds a valid password reset token
   */
  async findPasswordResetToken(token: string) {
    const hashedToken = createHash("sha256").update(token).digest("hex");

    return await prisma.passwordReset.findFirst({
      where: {
        token: hashedToken,
        expiresAt: {
          gt: new Date(),
        },
        usedAt: null,
      },
      include: {
        user: true,
      },
    });
  }

  /**
   * Marks a password reset token as used
   */
  async markPasswordResetTokenUsed(tokenId: string): Promise<void> {
    await prisma.passwordReset.update({
      where: { id: tokenId },
      data: { usedAt: new Date() },
    });
  }

  /**
   * Creates a new session for a user
   */
  async createSession(data: {
    userId: string;
    refreshToken: string;
    expiresAt: Date;
    ipAddress?: string;
    userAgent?: string;
  }) {
    return await prisma.session.create({
      data,
    });
  }

  /**
   * Finds a session by ID
   */
  async findSession(sessionId: string) {
    return await prisma.session.findUnique({
      where: { id: sessionId },
      include: { user: true },
    });
  }

  /**
   * Updates a session's refresh token
   */
  async updateSessionToken(sessionId: string, refreshToken: string, expiresAt: Date) {
    return await prisma.session.update({
      where: { id: sessionId },
      data: {
        refreshToken,
        expiresAt,
        lastActivityAt: new Date(),
      },
    });
  }

  /**
   * Revokes a specific session
   */
  async revokeSession(sessionId: string): Promise<void> {
    await prisma.session.update({
      where: { id: sessionId },
      data: { revokedAt: new Date() },
    });
  }

  /**
   * Revokes all sessions for a user
   */
  async revokeAllUserSessions(userId: string): Promise<void> {
    await prisma.session.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });
  }
}

export const userRepository = new UserRepository();
