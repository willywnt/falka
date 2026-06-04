import { DomainError } from '@/lib/errors';

export const RETURN_ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
} as const;

export type ReturnErrorCode = (typeof RETURN_ERROR_CODES)[keyof typeof RETURN_ERROR_CODES];

export class ReturnError extends DomainError {
  declare readonly code: ReturnErrorCode;

  constructor(code: ReturnErrorCode, message: string, statusCode = 400) {
    super(code, message, statusCode);
    this.name = 'ReturnError';
  }

  static validation(message: string) {
    return new ReturnError(RETURN_ERROR_CODES.VALIDATION_ERROR, message, 400);
  }

  static notFound(message = 'Return not found.') {
    return new ReturnError(RETURN_ERROR_CODES.NOT_FOUND, message, 404);
  }
}
