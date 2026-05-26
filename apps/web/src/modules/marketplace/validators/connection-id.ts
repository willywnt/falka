import { z } from 'zod';

export const marketplaceConnectionIdSchema = z.object({
  id: z.string().cuid(),
});

export type MarketplaceConnectionIdInput = z.infer<typeof marketplaceConnectionIdSchema>;
