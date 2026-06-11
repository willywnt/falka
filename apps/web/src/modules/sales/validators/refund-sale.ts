import { z } from 'zod';

/** Per-item quantities to refund from an existing sale (server re-validates remaining qty). */
export const refundSaleSchema = z.object({
  items: z
    .array(
      z.object({
        saleItemId: z.string().cuid(),
        quantity: z.number().int().positive(),
      }),
    )
    .min(1),
  note: z.string().trim().max(500).optional(),
});

export type RefundSaleInput = z.infer<typeof refundSaleSchema>;
