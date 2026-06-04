import { z } from 'zod';

export const searchVariantsQuerySchema = z.object({
  q: z.string().trim().max(100).optional().default(''),
});

export type SearchVariantsQuery = z.infer<typeof searchVariantsQuerySchema>;
