import { DomainError } from '@/lib/errors';

export const PURCHASE_ORDER_ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
} as const;

export type PurchaseOrderErrorCode =
  (typeof PURCHASE_ORDER_ERROR_CODES)[keyof typeof PURCHASE_ORDER_ERROR_CODES];

export class PurchaseOrderError extends DomainError {
  declare readonly code: PurchaseOrderErrorCode;

  constructor(code: PurchaseOrderErrorCode, message: string, statusCode = 400) {
    super(code, message, statusCode);
    this.name = 'PurchaseOrderError';
  }

  static validation(message: string) {
    return new PurchaseOrderError(PURCHASE_ORDER_ERROR_CODES.VALIDATION_ERROR, message, 400);
  }

  static notFound(message = 'Purchase order not found.') {
    return new PurchaseOrderError(PURCHASE_ORDER_ERROR_CODES.NOT_FOUND, message, 404);
  }
}
