import { prisma } from '@palka/db';
import type { MarketplaceProvider } from '@prisma/client';

export type RefreshableConnection = {
  id: string;
  provider: MarketplaceProvider;
  shopId: string;
  encryptedRefreshToken: string | null;
};

/** Providers whose tokens the worker can refresh (have OAuth refresh + a worker refresher). */
const REFRESHABLE_PROVIDERS: MarketplaceProvider[] = ['LAZADA', 'SHOPEE', 'TOKOPEDIA'];

/**
 * Active OAuth connections whose access token expires at or before `cutoff` (and that still
 * carry a refresh token). Soonest-expiring first, capped. Limited to providers the worker can
 * actually refresh; the job further gates each by configured credentials.
 */
export async function findConnectionsForTokenRefresh(
  cutoff: Date,
  limit: number,
): Promise<RefreshableConnection[]> {
  return prisma.marketplaceConnection.findMany({
    where: {
      isActive: true,
      deletedAt: null,
      provider: { in: REFRESHABLE_PROVIDERS },
      encryptedRefreshToken: { not: null },
      tokenExpiresAt: { not: null, lte: cutoff },
    },
    orderBy: { tokenExpiresAt: 'asc' },
    take: limit,
    select: { id: true, provider: true, shopId: true, encryptedRefreshToken: true },
  });
}

/** Re-seal a connection's tokens after an OAuth refresh (worker-side, server-only). */
export async function applyRefreshedConnectionTokens(
  connectionId: string,
  data: {
    encryptedAccessToken: string;
    encryptedRefreshToken: string;
    tokenExpiresAt: Date | null;
  },
): Promise<void> {
  await prisma.marketplaceConnection.update({
    where: { id: connectionId },
    data: {
      encryptedAccessToken: data.encryptedAccessToken,
      encryptedRefreshToken: data.encryptedRefreshToken,
      tokenExpiresAt: data.tokenExpiresAt,
      isActive: true,
    },
  });
}
