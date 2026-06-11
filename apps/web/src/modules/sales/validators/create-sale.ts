import { SalePaymentMethod } from '@prisma/client';
import { z } from 'zod';

/** A POS cart line: either a standalone variant or a bundle (exploded server-side). */
const saleLineSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('variant'),
    variantId: z.string().cuid(),
    quantity: z.number().int().positive(),
    unitPrice: z.number().nonnegative(),
  }),
  z.object({
    kind: z.literal('bundle'),
    bundleId: z.string().cuid(),
    quantity: z.number().int().positive(),
    /** The bundle's single price; allocated across its components at checkout. */
    unitPrice: z.number().nonnegative(),
  }),
]);

export const createSaleSchema = z.object({
  items: z.array(saleLineSchema).min(1),
  paymentMethod: z.nativeEnum(SalePaymentMethod),
  customerName: z.string().trim().max(120).optional(),
  note: z.string().trim().max(500).optional(),
  /** Cart-level discount; the server resolves it to rupiah and allocates per line. */
  discount: z
    .object({
      type: z.enum(['PERCENT', 'AMOUNT']),
      value: z.number().nonnegative(),
    })
    .optional(),
  /** PPN rate in percent (0–100); omitted/0 = no tax. */
  taxRate: z.number().min(0).max(100).optional(),
  /** true = prices already contain PPN (tax carved out, total unchanged). */
  taxInclusive: z.boolean().optional(),
});

export type CreateSaleInput = z.infer<typeof createSaleSchema>;
export type CreateSaleLine = z.infer<typeof saleLineSchema>;
