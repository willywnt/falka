import { MarketplaceProvider } from '@prisma/client';
import { z } from 'zod';

export const createMarketplaceConnectionSchema = z.object({
  provider: z.nativeEnum(MarketplaceProvider),
  shopId: z.string().trim().min(1, 'Shop ID is required').max(100),
  shopName: z.string().trim().min(1, 'Shop name is required').max(200),
  accessToken: z.string().trim().min(1, 'Access token is required').max(4096),
  refreshToken: z
    .string()
    .trim()
    .max(4096)
    .optional()
    .transform((value) => (value === '' ? undefined : value)),
  expiresAt: z.coerce.date().nullable().optional(),
});

export type CreateMarketplaceConnectionInput = z.infer<typeof createMarketplaceConnectionSchema>;

export const createMarketplaceConnectionFormSchema = z.object({
  provider: z.nativeEnum(MarketplaceProvider),
  shopId: z.string().trim().min(1, 'Shop ID is required').max(100),
  shopName: z.string().trim().min(1, 'Shop name is required').max(200),
  accessToken: z.string().trim().min(1, 'Access token is required').max(4096),
  refreshToken: z.string().trim().max(4096).optional(),
  expiresAt: z.date().nullable(),
});

export type CreateMarketplaceConnectionFormInput = z.infer<
  typeof createMarketplaceConnectionFormSchema
>;
