import { randomUUID } from "crypto";

import { Request, Response, NextFunction } from "express";
import pinoHttp from "pino-http";

import { config } from "@/config";
import { logger } from "@/utils/logger";

// Request ID middleware - adds unique ID to each request
export const requestIdMiddleware = (req: Request, _res: Response, next: NextFunction) => {
  req.id = (req.headers["x-request-id"] as string) || randomUUID();
  next();
};

// Pino HTTP logger middleware
export const httpLoggerMiddleware = pinoHttp({
  logger,
  genReqId: (req) => req.id,
  customLogLevel: (_req, res, err) => {
    if (res.statusCode >= 500 || err) return "error";
    if (res.statusCode >= 400) return "warn";
    return "info";
  },
  customSuccessMessage: (req, res) => {
    return `${req.method} ${req.url} ${res.statusCode}`;
  },
  customErrorMessage: (req, res) => {
    return `${req.method} ${req.url} ${res.statusCode}`;
  },
  // Don't log health checks in production
  autoLogging: {
    ignore: (req) => {
      return config.isProd && req.url === "/health";
    },
  },
  serializers: {
    req: (req) => ({
      id: req.id,
      method: req.method,
      url: req.url,
      remoteAddress: req.remoteAddress,
    }),
    res: (res) => ({
      statusCode: res.statusCode,
    }),
  },
});
