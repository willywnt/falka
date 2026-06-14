import { getServerEnv } from '@falka/config/env.server';
import { decrypt } from '@falka/utils/crypto';
import { logger } from '@falka/utils/logger';

import {
  computeStockDrift,
  findActiveConnectionsForDrift,
  findDriftMappedListings,
  getMarketplaceStockProvider,
  getProviderRateLimiter,
  isAccessTokenExpired,
} from '../marketplace-sync/index.js';
import {
  reconcileMarketplaceDriftJobSchema,
  type JobResultMetadata,
  type ReconcileMarketplaceDriftJobPayload,
} from '../types/index.js';

export function getDefaultReconcileMarketplaceDriftPayload(): ReconcileMarketplaceDriftJobPayload {
  return reconcileMarketplaceDriftJobSchema.parse({});
}

/**
 * Scheduled drift reconciliation: for each active connection whose provider can
 * report listings, pull current external stock and compare it to internal
 * available, logging any over/under/missing drift. READ-ONLY — never writes back
 * to the marketplace and never corrects internal stock (staff re-sync from the UI).
 * Best-effort per connection: one failure (token, provider) doesn't stop the rest.
 */
export async function processReconcileMarketplaceDriftJob(
  rawPayload: ReconcileMarketplaceDriftJobPayload,
): Promise<JobResultMetadata> {
  const startedAt = Date.now();
  const payload = reconcileMarketplaceDriftJobSchema.parse(rawPayload);

  const stats: JobResultMetadata = {
    processed: 0,
    succeeded: 0,
    failed: 0,
    skipped: 0,
    durationMs: 0,
  };

  const connections = await findActiveConnectionsForDrift(payload.batchSize);
  let totalDrifted = 0;

  for (const connection of connections) {
    stats.processed += 1;

    if (isAccessTokenExpired(connection.tokenExpiresAt)) {
      stats.skipped += 1;
      logger.warn('marketplace.drift.skipped_token_expired', {
        connectionId: connection.id,
        provider: connection.provider,
      });
      continue;
    }

    let accessToken = '';
    try {
      accessToken = decrypt(
        connection.encryptedAccessToken,
        getServerEnv().MARKETPLACE_ENCRYPTION_SECRET,
      );
    } catch {
      // Stub/seed connections store a non-cipher placeholder; a real adapter will
      // surface its own auth error below rather than failing here.
    }

    try {
      await getProviderRateLimiter(connection.provider).acquire();
      const external = await getMarketplaceStockProvider(connection.provider).fetchListings({
        accessToken,
      });

      // Provider can't enumerate listings (stub) — nothing to reconcile.
      if (external === null) {
        stats.skipped += 1;
        continue;
      }

      const mapped = await findDriftMappedListings(connection.organizationId, connection.id);
      const summary = computeStockDrift({ mapped, external });
      const driftCount = summary.drifted + summary.missingExternal;
      totalDrifted += driftCount;
      stats.succeeded += 1;

      const logContext = {
        connectionId: connection.id,
        provider: connection.provider,
        organizationId: connection.organizationId,
        totalMapped: summary.totalMapped,
        inSync: summary.inSync,
        drifted: summary.drifted,
        missingExternal: summary.missingExternal,
        unmappedExternal: summary.unmappedExternal,
      };
      if (driftCount > 0) {
        logger.warn('marketplace.drift.detected', logContext);
      } else {
        logger.info('marketplace.drift.reconciled', logContext);
      }
    } catch (error) {
      stats.failed += 1;
      logger.warn('marketplace.drift.failed', {
        connectionId: connection.id,
        provider: connection.provider,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  stats.durationMs = Date.now() - startedAt;
  stats.details = { connections: connections.length, totalDrifted };
  return stats;
}
