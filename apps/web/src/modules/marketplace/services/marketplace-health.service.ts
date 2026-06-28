import 'server-only';

import { prisma } from '@palka/db';
import type { MarketplaceConnection } from '@prisma/client';

import type {
  MarketplaceConnectionHealth,
  MarketplaceConnectionStatus,
  MarketplaceHealthTone,
} from '../types';
import { getTokenStatus, type TokenStatus } from '../utils/token-lifecycle';
import { MarketplaceError } from '../errors/marketplace-errors';

const DAY_MS = 24 * 60 * 60 * 1000;
const TOKEN_SOON_DAYS = 7;
/** Only the last week of sync jobs counts toward the "recent health" rollup. */
const RECENT_SYNC_WINDOW_MS = 7 * DAY_MS;

type ConnectionCounts = {
  mapped: number;
  syncEnabled: number;
  needsReview: number;
  failed: number;
  syncSuccess: number;
  syncFailed: number;
  syncPending: number;
};

function emptyCounts(): ConnectionCounts {
  return {
    mapped: 0,
    syncEnabled: 0,
    needsReview: 0,
    failed: 0,
    syncSuccess: 0,
    syncFailed: 0,
    syncPending: 0,
  };
}

function resolveTone(input: {
  isActive: boolean;
  tokenStatus: TokenStatus;
  tokenExpiringSoon: boolean;
  needsReview: number;
  failed: number;
}): MarketplaceHealthTone {
  if (!input.isActive || input.tokenStatus === 'expired' || input.failed > 0) {
    return 'danger';
  }
  if (input.tokenExpiringSoon || input.needsReview > 0) {
    return 'warn';
  }
  return 'ok';
}

function buildHealth(
  connection: MarketplaceConnection,
  counts: ConnectionCounts,
  now: Date,
): MarketplaceConnectionHealth {
  const tokenStatus = getTokenStatus(connection.tokenExpiresAt, now);
  // Mirrors marketplace-server.service's resolveConnectionStatus (kept local to
  // avoid a circular import between types and the token-lifecycle util).
  const connectionStatus: MarketplaceConnectionStatus = !connection.isActive
    ? 'disconnected'
    : tokenStatus === 'expired'
      ? 'expired'
      : 'connected';

  const tokenExpiresInDays = connection.tokenExpiresAt
    ? Math.floor((connection.tokenExpiresAt.getTime() - now.getTime()) / DAY_MS)
    : null;
  const tokenExpiringSoon =
    tokenStatus === 'valid' && tokenExpiresInDays !== null && tokenExpiresInDays <= TOKEN_SOON_DAYS;

  return {
    connectionId: connection.id,
    provider: connection.provider,
    shopId: connection.shopId,
    shopName: connection.shopName,
    isActive: connection.isActive,
    connectionStatus,
    tokenStatus,
    tokenExpiresAt: connection.tokenExpiresAt?.toISOString() ?? null,
    tokenExpiresInDays,
    tokenExpiringSoon,
    lastImportedAt: connection.lastImportedAt?.toISOString() ?? null,
    lastOrdersPulledAt: connection.lastOrdersPulledAt?.toISOString() ?? null,
    mappedCount: counts.mapped,
    syncEnabledCount: counts.syncEnabled,
    needsReviewCount: counts.needsReview,
    failedSyncCount: counts.failed,
    recentSync: {
      success: counts.syncSuccess,
      failed: counts.syncFailed,
      pending: counts.syncPending,
    },
    tone: resolveTone({
      isActive: connection.isActive,
      tokenStatus,
      tokenExpiringSoon,
      needsReview: counts.needsReview,
      failed: counts.failed,
    }),
  };
}

/**
 * Computes per-connection health from local data only (no provider calls): token
 * lifecycle, mapping coverage, listings awaiting review, failed pushes, and the
 * recent sync-job outcomes. Cheap enough to power the dashboard badges + nav pulse.
 */
export class MarketplaceHealthService {
  async listHealth(organizationId: string): Promise<MarketplaceConnectionHealth[]> {
    const since = new Date(Date.now() - RECENT_SYNC_WINDOW_MS);

    const [connections, mappedRows, enabledRows, reviewRows, failedRows, syncRows] =
      await Promise.all([
        prisma.marketplaceConnection.findMany({
          where: { organizationId, deletedAt: null },
          orderBy: [{ isActive: 'desc' }, { createdAt: 'desc' }],
        }),
        prisma.marketplaceProductMapping.groupBy({
          by: ['marketplaceConnectionId'],
          where: { organizationId },
          _count: { _all: true },
        }),
        prisma.marketplaceProductMapping.groupBy({
          by: ['marketplaceConnectionId'],
          where: { organizationId, syncEnabled: true },
          _count: { _all: true },
        }),
        prisma.marketplaceProductMapping.groupBy({
          by: ['marketplaceConnectionId'],
          where: { organizationId, mappingStatus: 'NEEDS_REVIEW' },
          _count: { _all: true },
        }),
        prisma.marketplaceProductMapping.groupBy({
          by: ['marketplaceConnectionId'],
          where: { organizationId, lastSyncStatus: 'FAILED' },
          _count: { _all: true },
        }),
        prisma.marketplaceSyncJob.groupBy({
          by: ['marketplaceConnectionId', 'syncStatus'],
          where: { organizationId, createdAt: { gte: since } },
          _count: { _all: true },
        }),
      ]);

    const counts = new Map<string, ConnectionCounts>();
    const ensure = (id: string): ConnectionCounts => {
      const existing = counts.get(id);
      if (existing) return existing;
      const created = emptyCounts();
      counts.set(id, created);
      return created;
    };

    for (const row of mappedRows) ensure(row.marketplaceConnectionId).mapped = row._count._all;
    for (const row of enabledRows)
      ensure(row.marketplaceConnectionId).syncEnabled = row._count._all;
    for (const row of reviewRows) ensure(row.marketplaceConnectionId).needsReview = row._count._all;
    for (const row of failedRows) ensure(row.marketplaceConnectionId).failed = row._count._all;
    for (const row of syncRows) {
      const bucket = ensure(row.marketplaceConnectionId);
      if (row.syncStatus === 'SUCCESS') bucket.syncSuccess += row._count._all;
      else if (row.syncStatus === 'FAILED') bucket.syncFailed += row._count._all;
      else if (row.syncStatus === 'PENDING' || row.syncStatus === 'PROCESSING') {
        bucket.syncPending += row._count._all;
      }
    }

    const now = new Date();
    return connections.map((connection) =>
      buildHealth(connection, counts.get(connection.id) ?? emptyCounts(), now),
    );
  }

  async getHealth(
    organizationId: string,
    connectionId: string,
  ): Promise<MarketplaceConnectionHealth> {
    const all = await this.listHealth(organizationId);
    const health = all.find((item) => item.connectionId === connectionId);
    if (!health) throw MarketplaceError.notFound();
    return health;
  }
}

export const marketplaceHealthService = new MarketplaceHealthService();
