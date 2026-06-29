import { createCipheriv, createDecipheriv, createHash, hkdfSync, randomBytes } from 'node:crypto';

export function generateId(length = 16): string {
  return randomBytes(length).toString('hex');
}

export function hashString(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export function generateStorageKey(organizationId: string, fileName: string): string {
  const timestamp = Date.now();
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  return `orgs/${organizationId}/recordings/${timestamp}-${safeName}`;
}

const TOKEN_CIPHER_ALGORITHM = 'aes-256-gcm';
const TOKEN_CIPHER_IV_LENGTH = 12;
/** Domain-separation label so the derived key isn't a bare hash and can't be shared by other uses. */
const TOKEN_KEY_INFO = 'palka:token-encryption:v1';

/**
 * Derive the 32-byte AES key from the secret via HKDF-SHA256 (vs a bare unsalted SHA-256 of the
 * secret), with an explicit `info` label for domain separation.
 */
function deriveTokenKey(secret: string): Buffer {
  return Buffer.from(
    hkdfSync('sha256', Buffer.from(secret, 'utf8'), new Uint8Array(0), TOKEN_KEY_INFO, 32),
  );
}

/** Legacy key derivation (unsalted SHA-256) — kept ONLY so ciphertexts written before the HKDF
 *  switch still decrypt; new ciphertexts always use {@link deriveTokenKey}. */
function legacyTokenKey(secret: string): Buffer {
  return createHash('sha256').update(secret).digest();
}

/**
 * Encrypts a secret/token with AES-256-GCM, returning `iv:authTag:ciphertext`
 * (all base64). Shared by the web marketplace module and the worker sync engine
 * so credentials are sealed and opened with one implementation.
 */
export function encrypt(plaintext: string, secret: string): string {
  const iv = randomBytes(TOKEN_CIPHER_IV_LENGTH);
  const cipher = createCipheriv(TOKEN_CIPHER_ALGORITHM, deriveTokenKey(secret), iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted.toString('base64')}`;
}

export function decrypt(payload: string, secret: string): string {
  const parts = payload.split(':');

  if (parts.length !== 3) {
    throw new Error('Invalid encrypted payload format');
  }

  const [ivBase64, authTagBase64, ciphertextBase64] = parts as [string, string, string];
  const iv = Buffer.from(ivBase64, 'base64');
  const authTag = Buffer.from(authTagBase64, 'base64');
  const ciphertext = Buffer.from(ciphertextBase64, 'base64');

  // Try the current HKDF key first, then the legacy SHA-256 key so any pre-HKDF ciphertext still
  // opens (GCM's auth tag makes a wrong-key attempt fail cleanly rather than return garbage).
  let lastError: unknown;
  for (const key of [deriveTokenKey(secret), legacyTokenKey(secret)]) {
    try {
      const decipher = createDecipheriv(TOKEN_CIPHER_ALGORITHM, key, iv);
      decipher.setAuthTag(authTag);
      return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error('Failed to decrypt payload');
}
