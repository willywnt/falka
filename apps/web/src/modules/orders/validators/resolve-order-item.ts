import { z } from 'zod';

export const resolveOrderItemSchema = z.object({
  orderItemId: z.string().cuid(),
  variantId: z.string().cuid(),
});

export type ResolveOrderItemInput = z.infer<typeof resolveOrderItemSchema>;
