import { z } from 'zod';

/** Normalize keyboard-wedge barcode input (strip whitespace, uppercase). */
export function normalizeBarcodeValue(raw: string): string {
  return raw.trim().replace(/\s+/g, '').toUpperCase();
}

export const noResiSchema = z
  .string()
  .trim()
  .min(3, 'Resi number must be at least 3 characters')
  .max(64, 'Resi number must be at most 64 characters')
  .regex(
    /^[A-Za-z0-9_-]+$/,
    'Resi number can only contain letters, numbers, dashes, and underscores',
  );

export type NoResiInput = z.infer<typeof noResiSchema>;
