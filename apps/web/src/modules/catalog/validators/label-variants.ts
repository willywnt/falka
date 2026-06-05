import { z } from 'zod';

/** Free-text filter for the label studio — matches SKU, barcode, variant or product name. */
export const labelVariantsQuerySchema = z.object({
  q: z.string().trim().max(100).optional().default(''),
});

export type LabelVariantsQuery = z.infer<typeof labelVariantsQuerySchema>;
