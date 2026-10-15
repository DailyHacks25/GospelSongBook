/**
 * Application error type with stable machine-readable codes.
 * Route handlers map these to HTTP responses; the UI maps them to messages.
 */

export type ErrorCode =
  | "bad_request"
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "conflict"
  | "validation_error"
  | "invalid_status_transition"
  | "rate_limited"
  | "external_service_error"
  | "internal_error";

const STATUS_BY_CODE: Record<ErrorCode, number> = {
  bad_request: 400,
  unauthorized: 401,
  forbidden: 403,
  not_found: 404,
  conflict: 409,
  validation_error: 422,
  invalid_status_transition: 422,
  rate_limited: 429,
  external_service_error: 502,
  internal_error: 500,
};

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  /** Optional per-field validation messages, keyed by field name. */
  readonly fields: Record<string, string> | undefined;

  constructor(
    code: ErrorCode,
    message: string,
    options?: { fields?: Record<string, string>; cause?: unknown },
  ) {
    super(message, options?.cause !== undefined ? { cause: options.cause } : undefined);
    this.name = "AppError";
    this.code = code;
    this.status = STATUS_BY_CODE[code];
    this.fields = options?.fields;
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/** Wrap an unknown thrown value into an AppError without leaking internals. */
export function toAppError(error: unknown): AppError {
  if (isAppError(error)) return error;
  return new AppError("internal_error", "Something went wrong. Please try again.", {
    cause: error,
  });
}
