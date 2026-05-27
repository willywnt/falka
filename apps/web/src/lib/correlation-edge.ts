/** Edge-safe correlation helpers (no Node.js APIs — safe for Next.js middleware). */

export const REQUEST_ID_HEADER = 'x-request-id';

export function resolveRequestId(headerValue: string | null | undefined): string {
  if (headerValue?.trim()) {
    return headerValue.trim();
  }

  return crypto.randomUUID();
}
