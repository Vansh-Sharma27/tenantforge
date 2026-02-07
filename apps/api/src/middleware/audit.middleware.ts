import { Request, Response, NextFunction } from "express";

/**
 * Audit middleware that attaches request context for audit logging
 * Should be applied early in the middleware chain
 */
export function auditMiddleware(req: Request, _res: Response, next: NextFunction) {
  // Attach audit context to request
  req.auditContext = {
    ipAddress: (req.ip || req.socket.remoteAddress || "unknown").replace("::ffff:", ""),
    userAgent: req.headers["user-agent"] || "unknown",
  };

  next();
}
