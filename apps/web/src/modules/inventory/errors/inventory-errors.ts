import { DomainError } from '@/lib/errors';

export const INVENTORY_ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  VARIANT_NOT_FOUND: 'VARIANT_NOT_FOUND',
  INSUFFICIENT_STOCK: 'INSUFFICIENT_STOCK',
} as const;

export type InventoryErrorCode = (typeof INVENTORY_ERROR_CODES)[keyof typeof INVENTORY_ERROR_CODES];

export class InventoryError extends DomainError {
  declare readonly code: InventoryErrorCode;

  constructor(
    code: InventoryErrorCode,
    message: string,
    statusCode = 400,
    details?: Record<string, unknown>,
  ) {
    super(code, message, statusCode, details);
    this.name = 'InventoryError';
  }

  static validation(message: string) {
    return new InventoryError(INVENTORY_ERROR_CODES.VALIDATION_ERROR, message, 400);
  }

  static variantNotFound() {
    return new InventoryError(
      INVENTORY_ERROR_CODES.VARIANT_NOT_FOUND,
      'Product variant not found.',
      404,
    );
  }

  static insufficientStock(available: number, delta: number) {
    return new InventoryError(
      INVENTORY_ERROR_CODES.INSUFFICIENT_STOCK,
      'This adjustment would drive available stock below zero.',
      409,
      { available, delta },
    );
  }
}
