import { z } from 'zod';

export const receivePurchaseOrderSchema = z.object({
  lines: z
    .array(
      z.object({
        purchaseOrderItemId: z.string().cuid(),
        quantity: z.number().int().positive(),
      }),
    )
    .min(1),
});

export type ReceivePurchaseOrderInput = z.infer<typeof receivePurchaseOrderSchema>;
