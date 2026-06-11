import { DomainError } from '@/lib/errors';

export const STOCK_OPNAME_ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
} as const;

export type StockOpnameErrorCode =
  (typeof STOCK_OPNAME_ERROR_CODES)[keyof typeof STOCK_OPNAME_ERROR_CODES];

export class StockOpnameError extends DomainError {
  declare readonly code: StockOpnameErrorCode;

  constructor(code: StockOpnameErrorCode, message: string, statusCode = 400) {
    super(code, message, statusCode);
    this.name = 'StockOpnameError';
  }

  static validation(message: string) {
    return new StockOpnameError(STOCK_OPNAME_ERROR_CODES.VALIDATION_ERROR, message, 400);
  }

  static notFound(message = 'Stock opname not found.') {
    return new StockOpnameError(STOCK_OPNAME_ERROR_CODES.NOT_FOUND, message, 404);
  }
}
