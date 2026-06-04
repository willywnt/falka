import { SalePaymentMethod } from '@prisma/client';
import { z } from 'zod';

export const createSaleSchema = z.object({
  items: z
    .array(
      z.object({
        variantId: z.string().cuid(),
        quantity: z.number().int().positive(),
        unitPrice: z.number().nonnegative(),
      }),
    )
    .min(1),
  paymentMethod: z.nativeEnum(SalePaymentMethod),
  customerName: z.string().trim().max(120).optional(),
  note: z.string().trim().max(500).optional(),
});

export type CreateSaleInput = z.infer<typeof createSaleSchema>;
