export const MARKETPLACE_ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  DUPLICATE_CONNECTION: 'DUPLICATE_CONNECTION',
  INVALID_PROVIDER: 'INVALID_PROVIDER',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  ENCRYPTION_ERROR: 'ENCRYPTION_ERROR',
  UNKNOWN: 'UNKNOWN',
} as const;

export type MarketplaceErrorCode =
  (typeof MARKETPLACE_ERROR_CODES)[keyof typeof MARKETPLACE_ERROR_CODES];

export class MarketplaceError extends Error {
  readonly code: MarketplaceErrorCode;
  readonly statusCode: number;

  constructor(code: MarketplaceErrorCode, message: string, statusCode = 400) {
    super(message);
    this.name = 'MarketplaceError';
    this.code = code;
    this.statusCode = statusCode;
  }

  static validation(message: string) {
    return new MarketplaceError(MARKETPLACE_ERROR_CODES.VALIDATION_ERROR, message, 400);
  }

  static duplicateConnection() {
    return new MarketplaceError(
      MARKETPLACE_ERROR_CODES.DUPLICATE_CONNECTION,
      'This marketplace store is already connected.',
      409,
    );
  }

  static invalidProvider() {
    return new MarketplaceError(
      MARKETPLACE_ERROR_CODES.INVALID_PROVIDER,
      'Unsupported marketplace provider.',
      400,
    );
  }

  static notFound(message = 'Marketplace connection not found.') {
    return new MarketplaceError(MARKETPLACE_ERROR_CODES.NOT_FOUND, message, 404);
  }

  static tokenExpired() {
    return new MarketplaceError(
      MARKETPLACE_ERROR_CODES.TOKEN_EXPIRED,
      'Marketplace access token has expired.',
      400,
    );
  }

  static encryption(message = 'Failed to process marketplace credentials.') {
    return new MarketplaceError(MARKETPLACE_ERROR_CODES.ENCRYPTION_ERROR, message, 500);
  }
}
