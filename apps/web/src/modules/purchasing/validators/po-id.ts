import { z } from 'zod';

export const purchaseOrderIdSchema = z.object({ id: z.string().cuid() });

export type PurchaseOrderIdInput = z.infer<typeof purchaseOrderIdSchema>;
