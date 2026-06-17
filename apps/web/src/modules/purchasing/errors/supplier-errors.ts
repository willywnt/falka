import { DomainError } from '@/lib/errors';

export const SUPPLIER_ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
} as const;

export type SupplierErrorCode = (typeof SUPPLIER_ERROR_CODES)[keyof typeof SUPPLIER_ERROR_CODES];

export class SupplierError extends DomainError {
  declare readonly code: SupplierErrorCode;

  constructor(code: SupplierErrorCode, message: string, statusCode = 400) {
    super(code, message, statusCode);
    this.name = 'SupplierError';
  }

  static validation(message: string) {
    return new SupplierError(SUPPLIER_ERROR_CODES.VALIDATION_ERROR, message, 400);
  }

  static notFound(message = 'Supplier not found.') {
    return new SupplierError(SUPPLIER_ERROR_CODES.NOT_FOUND, message, 404);
  }
}
