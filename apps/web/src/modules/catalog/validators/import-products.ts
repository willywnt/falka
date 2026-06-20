import { z } from 'zod';

import { MAX_IMPORT_CSV_LENGTH } from '../utils/product-csv';

/**
 * Bulk product import payload. The raw CSV text is sent as a JSON string (apiFetch
 * is JSON-only) and bounded to keep the request synchronous + memory-safe.
 * `commit=false` is a dry-run that returns a validated preview without writing.
 */
export const importProductsSchema = z.object({
  csv: z
    .string()
    .min(1, 'File CSV kosong.')
    .max(MAX_IMPORT_CSV_LENGTH, 'File CSV terlalu besar (maks ~2MB).'),
  commit: z.boolean().default(false),
});

export type ImportProductsInput = z.infer<typeof importProductsSchema>;
