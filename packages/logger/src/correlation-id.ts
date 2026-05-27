/** Edge-safe request ID utilities (Web Crypto — no Node.js built-ins). */

export const REQUEST_ID_HEADER = 'x-request-id';

export function generateRequestId(): string {
  return globalThis.crypto.randomUUID();
}

export function resolveRequestId(headerValue: string | null | undefined): string {
  if (headerValue && headerValue.trim().length > 0) {
    return headerValue.trim();
  }

  return generateRequestId();
}
