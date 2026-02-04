export interface ValidationErrorDetail {
  field: string;
  message: string;
  code?: string;
}

export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly errors?: ValidationErrorDetail[];

  constructor(
    statusCode: number,
    message: string,
    code?: string,
    errors?: ValidationErrorDetail[]
  ) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.code = code || "error";
    this.errors = errors;

    // Maintains proper stack trace for where error was thrown
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      type: `https://tenantforge.dev/errors/${this.code}`,
      title: this.message,
      status: this.statusCode,
      detail: this.message,
      errors: this.errors,
    };
  }
}

export class BadRequestError extends ApiError {
  constructor(message = "Bad request", errors?: ValidationErrorDetail[]) {
    super(400, message, "bad_request", errors);
    this.name = "BadRequestError";
  }
}

export class ValidationError extends ApiError {
  constructor(errors: ValidationErrorDetail[]) {
    super(400, "Validation failed", "validation", errors);
    this.name = "ValidationError";
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = "Unauthorized") {
    super(401, message, "unauthorized");
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends ApiError {
  constructor(message = "Forbidden") {
    super(403, message, "forbidden");
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends ApiError {
  constructor(resource = "Resource") {
    super(404, `${resource} not found`, "not_found");
    this.name = "NotFoundError";
  }
}

export class ConflictError extends ApiError {
  constructor(message: string) {
    super(409, message, "conflict");
    this.name = "ConflictError";
  }
}

export class TooManyRequestsError extends ApiError {
  constructor(message = "Too many requests") {
    super(429, message, "rate_limit_exceeded");
    this.name = "TooManyRequestsError";
  }
}

export class InternalServerError extends ApiError {
  constructor(message = "Internal server error") {
    super(500, message, "internal_error");
    this.name = "InternalServerError";
  }
}

/**
 * Generic application error with custom status code and code
 */
export class AppError extends ApiError {
  constructor(message: string, statusCode: number, code?: string) {
    super(statusCode, message, code);
    this.name = "AppError";
  }
}
