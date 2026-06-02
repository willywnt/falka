import { DomainError } from '@/lib/errors';

export const STORAGE_ERROR_CODES = {
  INVALID_MIME_TYPE: 'INVALID_MIME_TYPE',
  INVALID_FILE: 'INVALID_FILE',
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
  UPLOAD_EXPIRED: 'UPLOAD_EXPIRED',
  UNAUTHORIZED: 'UNAUTHORIZED',
  STORAGE_UNAVAILABLE: 'STORAGE_UNAVAILABLE',
} as const;

export type StorageErrorCode = (typeof STORAGE_ERROR_CODES)[keyof typeof STORAGE_ERROR_CODES];

export const STORAGE_ERROR_MESSAGES: Record<StorageErrorCode, string> = {
  INVALID_MIME_TYPE: 'Only video/webm uploads are supported.',
  INVALID_FILE: 'The uploaded file is invalid.',
  QUOTA_EXCEEDED: 'Storage quota exceeded. Delete files or upgrade your plan.',
  UPLOAD_EXPIRED: 'The upload URL has expired. Request a new one.',
  UNAUTHORIZED: 'You must be signed in to upload files.',
  STORAGE_UNAVAILABLE: 'Storage is temporarily unavailable.',
};

export class StorageError extends DomainError {
  declare readonly code: StorageErrorCode;

  constructor(code: StorageErrorCode, message?: string, statusCode?: number) {
    super(
      code,
      message ?? STORAGE_ERROR_MESSAGES[code],
      statusCode ?? StorageError.defaultStatusCode(code),
    );
    this.name = 'StorageError';
  }

  private static defaultStatusCode(code: StorageErrorCode): number {
    switch (code) {
      case STORAGE_ERROR_CODES.UNAUTHORIZED:
        return 401;
      case STORAGE_ERROR_CODES.QUOTA_EXCEEDED:
        return 403;
      case STORAGE_ERROR_CODES.INVALID_MIME_TYPE:
      case STORAGE_ERROR_CODES.INVALID_FILE:
      case STORAGE_ERROR_CODES.UPLOAD_EXPIRED:
        return 400;
      default:
        return 500;
    }
  }

  static invalidMimeType() {
    return new StorageError(STORAGE_ERROR_CODES.INVALID_MIME_TYPE);
  }

  static invalidFile(message?: string) {
    return new StorageError(STORAGE_ERROR_CODES.INVALID_FILE, message);
  }

  static quotaExceeded() {
    return new StorageError(STORAGE_ERROR_CODES.QUOTA_EXCEEDED);
  }

  static uploadExpired() {
    return new StorageError(STORAGE_ERROR_CODES.UPLOAD_EXPIRED);
  }

  static unauthorized() {
    return new StorageError(STORAGE_ERROR_CODES.UNAUTHORIZED);
  }

  static unavailable(message?: string) {
    return new StorageError(STORAGE_ERROR_CODES.STORAGE_UNAVAILABLE, message);
  }
}
