import { DomainError } from '@/lib/errors';

export const NOTIFICATION_ERROR_CODES = {
  NOT_FOUND: 'NOT_FOUND',
} as const;

export type NotificationErrorCode =
  (typeof NOTIFICATION_ERROR_CODES)[keyof typeof NOTIFICATION_ERROR_CODES];

export class NotificationError extends DomainError {
  declare readonly code: NotificationErrorCode;

  constructor(code: NotificationErrorCode, message: string, statusCode = 400) {
    super(code, message, statusCode);
    this.name = 'NotificationError';
  }

  static notFound(message = 'Notifikasi tidak ditemukan.') {
    return new NotificationError(NOTIFICATION_ERROR_CODES.NOT_FOUND, message, 404);
  }
}
