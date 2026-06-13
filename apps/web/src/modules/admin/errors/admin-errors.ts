import { DomainError } from '@/lib/errors';

export const ADMIN_ERROR_CODES = {
  EMAIL_TAKEN: 'ADMIN_EMAIL_TAKEN',
  ORG_NOT_FOUND: 'ADMIN_ORG_NOT_FOUND',
} as const;

export type AdminErrorCode = (typeof ADMIN_ERROR_CODES)[keyof typeof ADMIN_ERROR_CODES];

/**
 * Errors raised by the platform admin-ops provisioning flow. Extends
 * DomainError so the shared API handler maps them generically (code +
 * statusCode) without importing the admin module.
 */
export class AdminError extends DomainError {
  declare readonly code: AdminErrorCode;

  constructor(code: AdminErrorCode, message: string, statusCode: number) {
    super(code, message, statusCode);
    this.name = 'AdminError';
  }

  static emailTaken() {
    return new AdminError(ADMIN_ERROR_CODES.EMAIL_TAKEN, 'Email pemilik ini sudah terdaftar.', 409);
  }

  static orgNotFound() {
    return new AdminError(ADMIN_ERROR_CODES.ORG_NOT_FOUND, 'Organisasi tidak ditemukan.', 404);
  }
}
