import { z } from 'zod';

export const productIdParamSchema = z.object({
  id: z.string().cuid(),
});

export type ProductIdParam = z.infer<typeof productIdParamSchema>;
