import { generateId } from '@olshop/utils/crypto';

/**
 * Generates a unique recording filename.
 * Example: rec_20260527_a1b2c3d4.webm
 */
export function generateRecordingFilename(date = new Date()): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const uniqueId = generateId(8);

  return `rec_${year}${month}${day}_${uniqueId}.webm`;
}

/**
 * Builds an object key using:
 * recordings/{user_id}/{year}/{month}/{generated_filename}
 */
export function generateStorageKey(
  userId: string,
  generatedFilename: string,
  date = new Date(),
): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');

  return `recordings/${userId}/${year}/${month}/${generatedFilename}`;
}

export function isPendingStorageKey(storageKey: string): boolean {
  return storageKey.startsWith('pending/');
}
