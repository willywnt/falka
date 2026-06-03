export const SYNC_ERROR_CODES = {
  SYNC_FAILED: 'SYNC_FAILED',
  RATE_LIMITED: 'RATE_LIMITED',
  INVALID_TOKEN: 'INVALID_TOKEN',
  MAPPING_INVALID: 'MAPPING_INVALID',
  PROVIDER_UNAVAILABLE: 'PROVIDER_UNAVAILABLE',
  ACCOUNT_DISABLED: 'ACCOUNT_DISABLED',
} as const;

export type SyncErrorCode = (typeof SYNC_ERROR_CODES)[keyof typeof SYNC_ERROR_CODES];

/** Raised by the sync engine; `retryable` decides whether BullMQ should retry. */
export class MarketplaceSyncError extends Error {
  readonly code: SyncErrorCode;
  readonly retryable: boolean;

  constructor(code: SyncErrorCode, message: string, options?: { retryable?: boolean }) {
    super(message);
    this.name = 'MarketplaceSyncError';
    this.code = code;
    this.retryable = options?.retryable ?? false;
  }

  static syncFailed(message: string, retryable = true): MarketplaceSyncError {
    return new MarketplaceSyncError(SYNC_ERROR_CODES.SYNC_FAILED, message, { retryable });
  }

  static rateLimited(message = 'Provider rate limit reached.'): MarketplaceSyncError {
    return new MarketplaceSyncError(SYNC_ERROR_CODES.RATE_LIMITED, message, { retryable: true });
  }

  static providerUnavailable(message = 'Provider is unavailable.'): MarketplaceSyncError {
    return new MarketplaceSyncError(SYNC_ERROR_CODES.PROVIDER_UNAVAILABLE, message, {
      retryable: true,
    });
  }

  static mappingInvalid(message: string): MarketplaceSyncError {
    return new MarketplaceSyncError(SYNC_ERROR_CODES.MAPPING_INVALID, message, {
      retryable: false,
    });
  }

  static accountDisabled(message = 'Marketplace account is disabled.'): MarketplaceSyncError {
    return new MarketplaceSyncError(SYNC_ERROR_CODES.ACCOUNT_DISABLED, message, {
      retryable: false,
    });
  }
}
