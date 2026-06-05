import { z } from 'zod';

/** Variants whose QR/barcode label was just printed (stamp the printed time). */
export const markLabelsPrintedSchema = z.object({
  variantIds: z.array(z.string().min(1)).min(1).max(500),
});

export type MarkLabelsPrintedInput = z.infer<typeof markLabelsPrintedSchema>;
