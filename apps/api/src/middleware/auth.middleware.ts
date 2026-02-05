import { Request, Response, NextFunction } from "express";

import { UnauthorizedError } from "@/utils/errors";
import { verifyAccessToken } from "@/utils/jwt";

/**
 * Middleware that requires valid authentication.
 * Returns 401 if no token or invalid token.
 */
export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new UnauthorizedError("No authorization token provided");
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = verifyAccessToken(token);

    if (!decoded) {
      throw new UnauthorizedError("Invalid or expired token");
    }

    // Attach user to request
    req.user = decoded;

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Middleware that optionally attaches user if token is present.
 * Does not throw error if no token, just continues without user.
 */
export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      // No token provided, continue without user
      return next();
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = verifyAccessToken(token);

    if (decoded) {
      // Attach user to request if token is valid
      req.user = decoded;
    }

    // Continue regardless of token validity
    next();
  } catch (error) {
    // Ignore errors and continue without user
    next();
  }
}
