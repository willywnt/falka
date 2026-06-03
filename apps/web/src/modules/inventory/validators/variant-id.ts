import { z } from 'zod';

export const variantIdParamSchema = z.object({
  variantId: z.string().cuid(),
});

export type VariantIdParam = z.infer<typeof variantIdParamSchema>;
