import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';

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

function deriveTokenKey(secret: string): Buffer {
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
  const decipher = createDecipheriv(
    TOKEN_CIPHER_ALGORITHM,
    deriveTokenKey(secret),
    Buffer.from(ivBase64, 'base64'),
  );
  decipher.setAuthTag(Buffer.from(authTagBase64, 'base64'));

  return Buffer.concat([
    decipher.update(Buffer.from(ciphertextBase64, 'base64')),
    decipher.final(),
  ]).toString('utf8');
}
