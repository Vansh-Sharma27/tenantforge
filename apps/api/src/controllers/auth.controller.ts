import { Request, Response, NextFunction } from "express";

import {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "@/schemas/auth.schema";
import { authService } from "@/services/auth.service";
import { UnauthorizedError } from "@/utils/errors";

/**
 * Authentication controller handling HTTP requests/responses
 */
export class AuthController {
  /**
   * POST /api/v1/auth/register
   * Registers a new user account
   */
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      // Validate input
      const input = registerSchema.parse(req.body);

      // Register user
      const result = await authService.register(input);

      res.status(201).json({
        success: true,
        data: result,
        meta: {
          requestId: res.locals.requestId,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/verify-email
   * Verifies user email with token
   */
  async verifyEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const input = verifyEmailSchema.parse(req.body);

      const result = await authService.verifyEmail(input);

      res.status(200).json({
        success: true,
        data: result,
        meta: {
          requestId: res.locals.requestId,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/login
   * Authenticates user and returns tokens
   */
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const input = loginSchema.parse(req.body);

      // Extract IP and user agent for session tracking
      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.headers["user-agent"];

      const result = await authService.login(input, ipAddress, userAgent);

      res.status(200).json({
        success: true,
        data: result,
        meta: {
          requestId: res.locals.requestId,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/refresh
   * Refreshes access token
   */
  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const input = refreshTokenSchema.parse(req.body);

      const result = await authService.refresh(input);

      res.status(200).json({
        success: true,
        data: result,
        meta: {
          requestId: res.locals.requestId,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/forgot-password
   * Initiates password reset flow
   */
  async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const input = forgotPasswordSchema.parse(req.body);

      const result = await authService.forgotPassword(input);

      res.status(200).json({
        success: true,
        data: result,
        meta: {
          requestId: res.locals.requestId,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/reset-password
   * Resets user password with token
   */
  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const input = resetPasswordSchema.parse(req.body);

      const result = await authService.resetPassword(input);

      res.status(200).json({
        success: true,
        data: result,
        meta: {
          requestId: res.locals.requestId,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/logout
   * Revokes the session associated with the provided refresh token
   */
  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new UnauthorizedError("Authentication required");
      }

      const input = refreshTokenSchema.parse(req.body);

      const result = await authService.logout(input.refreshToken, req.user.userId);

      res.status(200).json({
        success: true,
        data: result,
        meta: {
          requestId: res.locals.requestId,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
