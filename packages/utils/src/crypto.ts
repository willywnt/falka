import { randomBytes, createHash } from 'node:crypto';

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
