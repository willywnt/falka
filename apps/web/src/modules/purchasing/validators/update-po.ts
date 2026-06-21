import { type z } from 'zod';

import { purchaseOrderBodySchema } from './create-po';

/** Editing a DRAFT replaces its supplier/note/lines wholesale; status never changes here. */
export const updatePurchaseOrderSchema = purchaseOrderBodySchema;

export type UpdatePurchaseOrderInput = z.infer<typeof updatePurchaseOrderSchema>;
