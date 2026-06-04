import { z } from 'zod';

export const createReturnSchema = z.object({
  orderId: z.string().cuid(),
  reason: z.string().trim().max(500).optional(),
});

export type CreateReturnInput = z.infer<typeof createReturnSchema>;
