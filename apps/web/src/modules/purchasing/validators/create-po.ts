import { z } from 'zod';

/** A PO cart line: either a standalone variant or a bundle (exploded server-side). */
export const purchaseOrderLineSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('variant'),
    variantId: z.string().cuid(),
    quantity: z.number().int().positive().max(100_000),
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

/** Supplier + note + lines — the shared body of both create and edit. */
export const purchaseOrderBodySchema = z.object({
  // Optional link to a saved Supplier; when set the server snapshots its name into supplierName.
  supplierId: z.string().cuid().optional(),
  supplierName: z.string().trim().max(120).optional(),
  note: z.string().trim().max(500).optional(),
  // Cap the line count so one request can't build an arbitrarily large lock-holding tx (DoS).
  items: z.array(purchaseOrderLineSchema).min(1).max(200),
});

export const createPurchaseOrderSchema = purchaseOrderBodySchema.extend({
  // DRAFT saves without reserving incoming stock; ORDERED (default) places it immediately.
  status: z.enum(['DRAFT', 'ORDERED']).default('ORDERED'),
});

export type CreatePurchaseOrderInput = z.infer<typeof createPurchaseOrderSchema>;
export type CreatePurchaseOrderLine = z.infer<typeof purchaseOrderLineSchema>;
