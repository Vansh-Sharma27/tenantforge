import cors from "cors";
import express, { Express } from "express";
import helmet from "helmet";

import { config } from "@/config";
import { auditMiddleware } from "@/middleware/audit.middleware";
import { errorMiddleware, notFoundMiddleware } from "@/middleware/error.middleware";
import { requestIdMiddleware, httpLoggerMiddleware } from "@/middleware/logger.middleware";
import { globalRateLimit } from "@/middleware/rate-limit.middleware";
import routes from "@/routes";

export function createApp(): Express {
  const app = express();

  // Trust proxy (for rate limiting, IP detection behind load balancer)
  app.set("trust proxy", 1);

  // Security headers
  app.use(helmet());

  // CORS
  app.use(
    cors({
      origin: config.isDev ? true : [config.server.appUrl],
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "X-Request-ID"],
    })
  );

  // Request ID generation
  app.use(requestIdMiddleware);

  // Request logging
  app.use(httpLoggerMiddleware);

  // Audit context middleware
  app.use(auditMiddleware);

  // Global rate limiting (applied to all routes)
  app.use(globalRateLimit);

  // Body parsing (Note: Webhooks use raw body, configured separately in webhook.routes.ts)
  app.use(express.json({ limit: "100kb" }));
  app.use(express.urlencoded({ extended: true, limit: "100kb" }));

  // Routes
  app.use(routes);

  // 404 handler
  app.use(notFoundMiddleware);

  // Error handler
  app.use(errorMiddleware);

  return app;
}
