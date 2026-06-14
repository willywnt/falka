import { prisma } from '@falka/db';
import type { MarketplaceProvider } from '@prisma/client';

export type RefreshableConnection = {
  id: string;
  provider: MarketplaceProvider;
  encryptedRefreshToken: string | null;
};

/**
 * Active Lazada connections whose access token expires at or before `cutoff`
 * (and that still carry a refresh token). Soonest-expiring first, capped.
 */
export async function findConnectionsForTokenRefresh(
  cutoff: Date,
  limit: number,
): Promise<RefreshableConnection[]> {
  return prisma.marketplaceConnection.findMany({
    where: {
      isActive: true,
      deletedAt: null,
      provider: 'LAZADA',
      encryptedRefreshToken: { not: null },
      tokenExpiresAt: { not: null, lte: cutoff },
    },
    orderBy: { tokenExpiresAt: 'asc' },
    take: limit,
    select: { id: true, provider: true, encryptedRefreshToken: true },
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
