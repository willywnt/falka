import { z } from 'zod';

import { MarketplaceProvider, RecordingStatus, UserRole } from '@prisma/client';

export const idParamSchema = z.object({
  id: z.string().cuid(),
});

export type IdParamInput = z.infer<typeof idParamSchema>;

export const userRoleSchema = z.nativeEnum(UserRole);

export const recordingStatusSchema = z.nativeEnum(RecordingStatus);

export const marketplaceProviderSchema = z.nativeEnum(MarketplaceProvider);

export const dateRangeSchema = z
  .object({
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
  })
  .refine(
    (value) => {
      if (value.from && value.to) return value.from <= value.to;
      return true;
    },
    { message: 'from must be before or equal to to' },
  );

export type DateRangeInput = z.infer<typeof dateRangeSchema>;

export const searchQuerySchema = z.object({
  q: z.string().trim().min(1).max(200).optional(),
});

export type SearchQueryInput = z.infer<typeof searchQuerySchema>;
