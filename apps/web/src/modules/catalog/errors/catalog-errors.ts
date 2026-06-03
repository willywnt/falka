import { DomainError } from '@/lib/errors';

export const CATALOG_ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  DUPLICATE_SKU: 'DUPLICATE_SKU',
} as const;

export type CatalogErrorCode = (typeof CATALOG_ERROR_CODES)[keyof typeof CATALOG_ERROR_CODES];

export class CatalogError extends DomainError {
  declare readonly code: CatalogErrorCode;

  constructor(code: CatalogErrorCode, message: string, statusCode = 400) {
    super(code, message, statusCode);
    this.name = 'CatalogError';
  }

  static validation(message: string) {
    return new CatalogError(CATALOG_ERROR_CODES.VALIDATION_ERROR, message, 400);
  }

  static notFound(message = 'Product not found.') {
    return new CatalogError(CATALOG_ERROR_CODES.NOT_FOUND, message, 404);
  }

  static duplicateSku(sku: string) {
    return new CatalogError(
      CATALOG_ERROR_CODES.DUPLICATE_SKU,
      `A variant with SKU "${sku}" already exists.`,
      409,
    );
  }
}
