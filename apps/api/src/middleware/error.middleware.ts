import { Request, Response, NextFunction, ErrorRequestHandler } from "express";
import { ZodError } from "zod";

import { ApiError } from "@/utils/errors";
import { logger } from "@/utils/logger";

export const errorMiddleware: ErrorRequestHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  const requestId = req.id || "unknown";

  // Log the error
  logger.error({
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    requestId,
  });

  // Handle known API errors
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      ...err.toJSON(),
      instance: req.path,
      traceId: requestId,
    });
    return;
  }

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const errors = err.errors.map((e) => ({
      field: e.path.join("."),
      message: e.message,
      code: e.code,
    }));

    res.status(400).json({
      type: "https://tenantforge.dev/errors/validation",
      title: "Validation Error",
      status: 400,
      detail: "Request validation failed",
      errors,
      instance: req.path,
      traceId: requestId,
    });
    return;
  }

  // Handle unknown errors - don't leak details in production
  res.status(500).json({
    type: "https://tenantforge.dev/errors/internal",
    title: "Internal Server Error",
    status: 500,
    detail: process.env.NODE_ENV === "development" ? err.message : "An unexpected error occurred",
    instance: req.path,
    traceId: requestId,
  });
};

export const notFoundMiddleware = (req: Request, res: Response) => {
  const requestId = req.id || "unknown";

  res.status(404).json({
    type: "https://tenantforge.dev/errors/not_found",
    title: "Not Found",
    status: 404,
    detail: `Route ${req.method} ${req.path} not found`,
    instance: req.path,
    traceId: requestId,
  });
};
