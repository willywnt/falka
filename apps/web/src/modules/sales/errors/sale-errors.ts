import { DomainError } from '@/lib/errors';

export const SALE_ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
} as const;

export type SaleErrorCode = (typeof SALE_ERROR_CODES)[keyof typeof SALE_ERROR_CODES];

export class SaleError extends DomainError {
  declare readonly code: SaleErrorCode;

  constructor(code: SaleErrorCode, message: string, statusCode = 400) {
    super(code, message, statusCode);
    this.name = 'SaleError';
  }

  static validation(message: string) {
    return new SaleError(SALE_ERROR_CODES.VALIDATION_ERROR, message, 400);
  }

  static notFound(message = 'Sale not found.') {
    return new SaleError(SALE_ERROR_CODES.NOT_FOUND, message, 404);
  }
}
