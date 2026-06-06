import { z } from 'zod';

/** Allowed share-link lifetimes (hours): 24h, 7 days, 30 days. */
export const SHARE_LINK_TTL_HOURS = [24, 168, 720] as const;

export const SHARE_LINK_TTL_OPTIONS = [
  { hours: 24, label: '24 hours' },
  { hours: 168, label: '7 days' },
  { hours: 720, label: '30 days' },
] as const;

export const createShareLinkSchema = z.object({
  expiresInHours: z
    .number()
    .int()
    .refine(
      (value) => (SHARE_LINK_TTL_HOURS as readonly number[]).includes(value),
      'Unsupported expiry',
    )
    .default(168),
});

export type CreateShareLinkInput = z.infer<typeof createShareLinkSchema>;

export const shareLinkParamsSchema = z.object({
  id: z.string().min(1),
  shareLinkId: z.string().min(1),
});
