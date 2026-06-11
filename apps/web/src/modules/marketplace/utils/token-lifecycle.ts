export type TokenStatus = 'valid' | 'expired' | 'unknown';

import { formatDateTime } from '@/lib/formatters';

const TOKEN_EXPIRY_WARNING_MS = 24 * 60 * 60 * 1000;

export function isTokenExpired(
  expiresAt: Date | string | null | undefined,
  now = new Date(),
): boolean {
  if (!expiresAt) return false;

  const expiry = expiresAt instanceof Date ? expiresAt : new Date(expiresAt);
  if (Number.isNaN(expiry.getTime())) return false;

  return expiry.getTime() <= now.getTime();
}

export function getTokenStatus(
  expiresAt: Date | string | null | undefined,
  now = new Date(),
): TokenStatus {
  if (!expiresAt) return 'unknown';
  return isTokenExpired(expiresAt, now) ? 'expired' : 'valid';
}

export function isTokenExpiringSoon(
  expiresAt: Date | string | null | undefined,
  now = new Date(),
): boolean {
  if (!expiresAt) return false;

  const expiry = expiresAt instanceof Date ? expiresAt : new Date(expiresAt);
  if (Number.isNaN(expiry.getTime())) return false;

  return expiry.getTime() - now.getTime() <= TOKEN_EXPIRY_WARNING_MS;
}

export function formatTokenExpiry(
  expiresAt: Date | string | null | undefined,
  now = new Date(),
): string {
  if (!expiresAt) return 'Tanpa masa berlaku';

  const expiry = expiresAt instanceof Date ? expiresAt : new Date(expiresAt);
  if (Number.isNaN(expiry.getTime())) return 'Masa berlaku tidak valid';

  if (isTokenExpired(expiry, now)) {
    return `Kedaluwarsa ${formatDateTime(expiry)}`;
  }

  return formatDateTime(expiry);
}

export function formatTokenExpiryRelative(
  expiresAt: Date | string | null | undefined,
  now = new Date(),
): string {
  if (!expiresAt) return 'Tanpa masa berlaku';

  const expiry = expiresAt instanceof Date ? expiresAt : new Date(expiresAt);
  if (Number.isNaN(expiry.getTime())) return 'Masa berlaku tidak valid';

  const diffMs = expiry.getTime() - now.getTime();
  const absMs = Math.abs(diffMs);
  const minutes = Math.round(absMs / (60 * 1000));
  const hours = Math.round(absMs / (60 * 60 * 1000));
  const days = Math.round(absMs / (24 * 60 * 60 * 1000));

  if (diffMs <= 0) {
    if (minutes < 60) return `Kedaluwarsa ${minutes} mnt lalu`;
    if (hours < 48) return `Kedaluwarsa ${hours} jam lalu`;
    return `Kedaluwarsa ${days} hari lalu`;
  }

  if (minutes < 60) return `Berlaku ${minutes} mnt lagi`;
  if (hours < 48) return `Berlaku ${hours} jam lagi`;
  return `Berlaku ${days} hari lagi`;
}
