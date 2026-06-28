import { ALLOWED_UPLOAD_MIME_TYPES } from '@palka/config/limits';

export const ALLOWED_MIME_TYPES = ALLOWED_UPLOAD_MIME_TYPES;

export function isAllowedMimeType(mimeType: string): boolean {
  return (ALLOWED_UPLOAD_MIME_TYPES as readonly string[]).includes(mimeType);
}

export function hasAllowedExtension(
  filename: string,
  allowedExtensions: readonly string[],
): boolean {
  const normalized = filename.trim().toLowerCase();
  return allowedExtensions.some((extension) => normalized.endsWith(extension));
}

export function assertAllowedMimeType(mimeType: string): void {
  if (!isAllowedMimeType(mimeType)) {
    throw new Error(`Unsupported MIME type: ${mimeType}`);
  }
}
