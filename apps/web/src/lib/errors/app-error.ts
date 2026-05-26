export type AppErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR'
  | 'NETWORK_ERROR'
  | 'UNKNOWN';

export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly statusCode: number;
  readonly details?: Record<string, unknown>;

  constructor(
    message: string,
    code: AppErrorCode = 'UNKNOWN',
    statusCode = 500,
    details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }

  static validation(message: string, details?: Record<string, unknown>) {
    return new AppError(message, 'VALIDATION_ERROR', 400, details);
  }

  static unauthorized(message = 'Unauthorized') {
    return new AppError(message, 'UNAUTHORIZED', 401);
  }

  static forbidden(message = 'Forbidden') {
    return new AppError(message, 'FORBIDDEN', 403);
  }

  static notFound(message = 'Resource not found') {
    return new AppError(message, 'NOT_FOUND', 404);
  }

  static internal(message = 'Internal server error') {
    return new AppError(message, 'INTERNAL_ERROR', 500);
  }

  static fromUnknown(error: unknown): AppError {
    if (error instanceof AppError) return error;
    if (error instanceof Error) return new AppError(error.message, 'UNKNOWN');
    return new AppError('An unexpected error occurred', 'UNKNOWN');
  }
}
