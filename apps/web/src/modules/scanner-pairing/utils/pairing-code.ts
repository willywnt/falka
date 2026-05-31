import { randomBytes, randomUUID } from 'crypto';

/** Cryptographically secure pairing code (embedded in QR as `code` for mobile auto sign-in). */
export function generatePairingCode(): string {
  return randomBytes(24).toString('base64url');
}

export function generatePairingSessionId(): string {
  return randomUUID();
}
