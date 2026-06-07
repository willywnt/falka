import { z } from 'zod';

/** A PO cart line: either a standalone variant or a bundle (exploded server-side). */
const purchaseOrderLineSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('variant'),
    variantId: z.string().cuid(),
    quantity: z.number().int().positive(),
    unitCost: z.number().nonnegative(),
  }),
  z.object({
    kind: z.literal('bundle'),
    bundleId: z.string().cuid(),
    quantity: z.number().int().positive(),
    /** The bundle's single cost; allocated across its components at create time. */
    unitCost: z.number().nonnegative(),
  }),
]);

export const createPurchaseOrderSchema = z.object({
  supplierName: z.string().trim().max(120).optional(),
  note: z.string().trim().max(500).optional(),
  items: z.array(purchaseOrderLineSchema).min(1),
});

export type CreatePurchaseOrderInput = z.infer<typeof createPurchaseOrderSchema>;
export type CreatePurchaseOrderLine = z.infer<typeof purchaseOrderLineSchema>;
