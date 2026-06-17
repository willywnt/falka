import { z } from 'zod';

/** One year — matches the variant's leadTimeDays ceiling. */
const MAX_LEAD_DAYS = 365;
const MAX_MOQ = 1_000_000;

/** A nullable, optional non-negative int field (null clears it; absent leaves it). */
const optionalCount = (max: number) =>
  z.number().int().nonnegative().max(max).nullable().optional();

export const createSupplierSchema = z.object({
  name: z.string().trim().min(1).max(120),
  phone: z.string().trim().max(40).nullable().optional(),
  note: z.string().trim().max(500).nullable().optional(),
  // Reorder fallbacks — used only when a variant's own value is null.
  defaultLeadTimeDays: optionalCount(MAX_LEAD_DAYS),
  defaultMinOrderQty: optionalCount(MAX_MOQ),
});

export const updateSupplierSchema = createSupplierSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export const supplierIdSchema = z.object({ id: z.string().cuid() });

export type CreateSupplierInput = z.infer<typeof createSupplierSchema>;
export type UpdateSupplierInput = z.infer<typeof updateSupplierSchema>;
