import { z } from 'zod';

export const createPurchaseOrderSchema = z.object({
  supplierName: z.string().trim().max(120).optional(),
  note: z.string().trim().max(500).optional(),
  items: z
    .array(
      z.object({
        variantId: z.string().cuid(),
        quantity: z.number().int().positive(),
        unitCost: z.number().nonnegative(),
      }),
    )
    .min(1),
});

export type CreatePurchaseOrderInput = z.infer<typeof createPurchaseOrderSchema>;
