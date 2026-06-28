import { generateId } from '@palka/utils/crypto';

// Org/pending key predicates are shared infra — re-exported from @palka/storage so the
// web app and the worker validate keys identically (see packages/storage/src/keys.ts).
export { isOrgStorageKey, isPendingStorageKey } from '@palka/storage';

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
 * Generates a unique product-image filename.
 * Example: img_20260606_a1b2c3d4.webp
 */
export function generateImageFilename(extension: string, date = new Date()): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const uniqueId = generateId(8);

  return `img_${year}${month}${day}_${uniqueId}${extension}`;
}

/** Builds a recording object key: {organization_id}/{year}/{month}/{generated_filename}. */
export function generateStorageKey(
  organizationId: string,
  generatedFilename: string,
  date = new Date(),
): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');

  return `${organizationId}/${year}/${month}/${generatedFilename}`;
}

/** Builds a product-image object key: {organization_id}/{generated_filename} (flat, no date). */
export function generateProductImageKey(organizationId: string, generatedFilename: string): string {
  return `${organizationId}/${generatedFilename}`;
}
