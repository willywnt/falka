export const INVENTORY_ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  DUPLICATE_SKU: 'DUPLICATE_SKU',
  DUPLICATE_SLUG: 'DUPLICATE_SLUG',
  INSUFFICIENT_STOCK: 'INSUFFICIENT_STOCK',
  INSUFFICIENT_RESERVED: 'INSUFFICIENT_RESERVED',
  RESERVATION_OVERFLOW: 'RESERVATION_OVERFLOW',
  NEGATIVE_STOCK: 'NEGATIVE_STOCK',
  INVALID_ADJUSTMENT: 'INVALID_ADJUSTMENT',
  INACTIVE_VARIANT: 'INACTIVE_VARIANT',
  INACTIVE_PRODUCT: 'INACTIVE_PRODUCT',
  IDEMPOTENCY_REPLAY: 'IDEMPOTENCY_REPLAY',
} as const;

export type InventoryErrorCode = (typeof INVENTORY_ERROR_CODES)[keyof typeof INVENTORY_ERROR_CODES];

export class InventoryError extends Error {
  readonly code: InventoryErrorCode;
  readonly statusCode: number;

  constructor(code: InventoryErrorCode, message: string, statusCode = 400) {
    super(message);
    this.name = 'InventoryError';
    this.code = code;
    this.statusCode = statusCode;
  }

  static validation(message: string) {
    return new InventoryError(INVENTORY_ERROR_CODES.VALIDATION_ERROR, message, 400);
  }

  static notFound(message = 'Resource not found.') {
    return new InventoryError(INVENTORY_ERROR_CODES.NOT_FOUND, message, 404);
  }

  static duplicateSku() {
    return new InventoryError(
      INVENTORY_ERROR_CODES.DUPLICATE_SKU,
      'A variant with this SKU already exists.',
      409,
    );
  }

  static duplicateSlug() {
    return new InventoryError(
      INVENTORY_ERROR_CODES.DUPLICATE_SLUG,
      'A product with this slug already exists.',
      409,
    );
  }

  static insufficientStock(available: number, requested: number) {
    return new InventoryError(
      INVENTORY_ERROR_CODES.INSUFFICIENT_STOCK,
      `Insufficient available stock. Available: ${available}, requested: ${requested}.`,
      409,
    );
  }

  static insufficientReserved(reserved: number, requested: number) {
    return new InventoryError(
      INVENTORY_ERROR_CODES.INSUFFICIENT_RESERVED,
      `Insufficient reserved stock. Reserved: ${reserved}, requested: ${requested}.`,
      409,
    );
  }

  static reservationOverflow(available: number, requested: number) {
    return new InventoryError(
      INVENTORY_ERROR_CODES.RESERVATION_OVERFLOW,
      `Cannot reserve ${requested} units. Only ${available} available.`,
      409,
    );
  }

  static invalidAdjustment(message: string) {
    return new InventoryError(INVENTORY_ERROR_CODES.INVALID_ADJUSTMENT, message, 400);
  }

  static negativeStock(field: string) {
    return new InventoryError(
      INVENTORY_ERROR_CODES.NEGATIVE_STOCK,
      `${field} cannot be negative.`,
      400,
    );
  }

  static inactiveVariant() {
    return new InventoryError(
      INVENTORY_ERROR_CODES.INACTIVE_VARIANT,
      'Stock mutations are not allowed on inactive variants.',
      400,
    );
  }

  static inactiveProduct() {
    return new InventoryError(
      INVENTORY_ERROR_CODES.INACTIVE_PRODUCT,
      'Variants cannot be created on inactive products.',
      400,
    );
  }
}
