import { Request, Response, NextFunction } from "express";

import { auditService } from "@/services/audit.service";
import { rateLimitService } from "@/services/rate-limit.service";
import { AuditActions } from "@/types/audit.types";
import { logger } from "@/utils/logger";

/**
 * Global rate limit middleware (IP-based)
 * Applied to all routes
 */
export async function globalRateLimit(req: Request, res: Response, next: NextFunction) {
  try {
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    const result = await rateLimitService.consume(rateLimitService.globalLimiter, ip);

    // Set rate limit headers
    res.setHeader("X-RateLimit-Limit", result.limit);
    res.setHeader("X-RateLimit-Remaining", result.remaining);
    res.setHeader("X-RateLimit-Reset", result.reset.toISOString());

    next();
  } catch (error: any) {
    if (error.rateLimitExceeded) {
      // Log rate limit violation
      auditService.log({
        actorType: "system",
        action: AuditActions.RATE_LIMIT_EXCEEDED,
        ipAddress: req.ip || req.socket.remoteAddress,
        userAgent: req.headers["user-agent"],
        metadata: {
          limiter: "global",
          path: req.path,
        },
      });

      res.setHeader("Retry-After", error.retryAfter);
      res.setHeader("X-RateLimit-Limit", error.limit);
      res.setHeader("X-RateLimit-Remaining", error.remaining);
      res.setHeader("X-RateLimit-Reset", error.reset.toISOString());

      return res.status(429).json({
        success: false,
        error: {
          code: "RATE_LIMIT_EXCEEDED",
          message: "Too many requests",
          retryAfter: error.retryAfter,
        },
      });
    }

    // For other errors, log and continue (fail open)
    logger.error({ error }, "Rate limit check failed");
    next();
  }
}

/**
 * Auth rate limit middleware (stricter, IP-based)
 * Applied to authentication routes
 */
export async function authRateLimit(req: Request, res: Response, next: NextFunction) {
  try {
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    const result = await rateLimitService.consume(rateLimitService.authLimiter, ip);

    res.setHeader("X-RateLimit-Limit", result.limit);
    res.setHeader("X-RateLimit-Remaining", result.remaining);
    res.setHeader("X-RateLimit-Reset", result.reset.toISOString());

    next();
  } catch (error: any) {
    if (error.rateLimitExceeded) {
      auditService.log({
        actorType: "system",
        action: AuditActions.RATE_LIMIT_EXCEEDED,
        ipAddress: req.ip || req.socket.remoteAddress,
        userAgent: req.headers["user-agent"],
        metadata: {
          limiter: "auth",
          path: req.path,
        },
      });

      res.setHeader("Retry-After", error.retryAfter);
      res.setHeader("X-RateLimit-Limit", error.limit);
      res.setHeader("X-RateLimit-Remaining", error.remaining);
      res.setHeader("X-RateLimit-Reset", error.reset.toISOString());

      return res.status(429).json({
        success: false,
        error: {
          code: "RATE_LIMIT_EXCEEDED",
          message: "Too many authentication attempts",
          retryAfter: error.retryAfter,
        },
      });
    }

    logger.error({ error }, "Auth rate limit check failed");
    next();
  }
}

/**
 * Workspace rate limit middleware (plan-based)
 * Applied to workspace-scoped routes
 */
export async function workspaceRateLimit(req: Request, res: Response, next: NextFunction) {
  try {
    const workspace = req.workspace;

    if (!workspace) {
      // No workspace context, skip rate limiting
      return next();
    }

    const limiter = rateLimitService.getWorkspaceLimiter(workspace.plan);
    const result = await rateLimitService.consume(limiter, workspace.id);

    res.setHeader("X-RateLimit-Limit", result.limit);
    res.setHeader("X-RateLimit-Remaining", result.remaining);
    res.setHeader("X-RateLimit-Reset", result.reset.toISOString());

    next();
  } catch (error: any) {
    if (error.rateLimitExceeded) {
      const workspace = req.workspace;

      auditService.log({
        workspaceId: workspace?.id,
        actorId: req.user?.userId,
        actorType: "user",
        action: AuditActions.RATE_LIMIT_EXCEEDED,
        ipAddress: req.ip || req.socket.remoteAddress,
        userAgent: req.headers["user-agent"],
        metadata: {
          limiter: "workspace",
          plan: workspace?.plan,
          path: req.path,
        },
      });

      res.setHeader("Retry-After", error.retryAfter);
      res.setHeader("X-RateLimit-Limit", error.limit);
      res.setHeader("X-RateLimit-Remaining", error.remaining);
      res.setHeader("X-RateLimit-Reset", error.reset.toISOString());

      return res.status(429).json({
        success: false,
        error: {
          code: "RATE_LIMIT_EXCEEDED",
          message: `Workspace API limit exceeded. Upgrade to ${workspace?.plan === "FREE" ? "PRO" : "ENTERPRISE"} for higher limits.`,
          retryAfter: error.retryAfter,
        },
      });
    }

    logger.error({ error }, "Workspace rate limit check failed");
    next();
  }
}
