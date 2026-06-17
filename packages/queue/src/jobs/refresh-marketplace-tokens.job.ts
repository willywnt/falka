import { getServerEnv } from '@falka/config/env.server';
import { decrypt, encrypt } from '@falka/utils/crypto';
import { logger } from '@falka/utils/logger';

import {
  applyRefreshedConnectionTokens,
  canRefreshProvider,
  findConnectionsForTokenRefresh,
  refreshProviderToken,
} from '../marketplace-sync/index.js';
import {
  refreshMarketplaceTokensJobSchema,
  type JobResultMetadata,
  type RefreshMarketplaceTokensJobPayload,
} from '../types/index.js';

const DAY_MS = 24 * 60 * 60 * 1000;

export function getDefaultRefreshMarketplaceTokensPayload(): RefreshMarketplaceTokensJobPayload {
  return refreshMarketplaceTokensJobSchema.parse({});
}

/**
 * Scheduled token refresh: renews access tokens that expire within the configured window,
 * before they lapse and break stock sync. Dispatches per provider (Lazada, Shopee); uses each
 * connection's stored refresh token and keeps the old one when the provider doesn't rotate it.
 * Best-effort per connection — a dead refresh token fails just that one (surfaced in the health
 * dashboard as expired). NOTE: Shopee tokens last only ~4h, so the sync engine ALSO refreshes
 * lazily before use ({@link ensureFreshAccessToken}); this daily cron is the backstop.
 */
export async function processRefreshMarketplaceTokensJob(
  rawPayload: RefreshMarketplaceTokensJobPayload,
): Promise<JobResultMetadata> {
  const startedAt = Date.now();
  const payload = refreshMarketplaceTokensJobSchema.parse(rawPayload);
  const env = getServerEnv();

  const stats: JobResultMetadata = {
    processed: 0,
    succeeded: 0,
    failed: 0,
    skipped: 0,
    durationMs: 0,
  };

  if (!canRefreshProvider('LAZADA') && !canRefreshProvider('SHOPEE')) {
    logger.info('marketplace.token.refresh_skipped_unconfigured');
    stats.durationMs = Date.now() - startedAt;
    return stats;
  }

  const cutoff = new Date(Date.now() + payload.expiringWithinDays * DAY_MS);
  const connections = await findConnectionsForTokenRefresh(cutoff, payload.batchSize);

  for (const connection of connections) {
    stats.processed += 1;

    // The provider's credentials aren't configured on this worker — leave it for a worker that has them.
    if (!canRefreshProvider(connection.provider)) {
      stats.skipped += 1;
      continue;
    }

    if (!connection.encryptedRefreshToken) {
      stats.skipped += 1;
      continue;
    }

    let refreshToken = '';
    try {
      refreshToken = decrypt(connection.encryptedRefreshToken, env.MARKETPLACE_ENCRYPTION_SECRET);
    } catch {
      stats.skipped += 1;
      logger.warn('marketplace.token.refresh_token_decrypt_failed', {
        connectionId: connection.id,
      });
      continue;
    }
    if (!refreshToken) {
      stats.skipped += 1;
      continue;
    }

    try {
      const refreshed = await refreshProviderToken({
        provider: connection.provider,
        refreshToken,
        shopId: connection.shopId,
      });

      const expiresAt =
        refreshed.expiresInSeconds > 0
          ? new Date(Date.now() + refreshed.expiresInSeconds * 1000)
          : null;

      await applyRefreshedConnectionTokens(connection.id, {
        encryptedAccessToken: encrypt(refreshed.accessToken, env.MARKETPLACE_ENCRYPTION_SECRET),
        // Keep the existing refresh token when the provider doesn't rotate it.
        encryptedRefreshToken: refreshed.refreshToken
          ? encrypt(refreshed.refreshToken, env.MARKETPLACE_ENCRYPTION_SECRET)
          : connection.encryptedRefreshToken,
        tokenExpiresAt: expiresAt,
      });

      stats.succeeded += 1;
      logger.info('marketplace.token.refreshed', {
        connectionId: connection.id,
        provider: connection.provider,
      });
    } catch (error) {
      stats.failed += 1;
      logger.warn('marketplace.token.refresh_failed', {
        connectionId: connection.id,
        provider: connection.provider,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  stats.durationMs = Date.now() - startedAt;
  return stats;
}
