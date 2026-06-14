import { getServerEnv } from '@falka/config/env.server';
import { refreshLazadaToken } from '@falka/marketplace-providers';
import { decrypt, encrypt } from '@falka/utils/crypto';
import { logger } from '@falka/utils/logger';

import {
  applyRefreshedConnectionTokens,
  findConnectionsForTokenRefresh,
} from '../marketplace-sync/index.js';
import {
  refreshMarketplaceTokensJobSchema,
  type JobResultMetadata,
  type RefreshMarketplaceTokensJobPayload,
} from '../types/index.js';

const DEFAULT_BASE_URL = 'https://api.lazada.co.id/rest';
const DAY_MS = 24 * 60 * 60 * 1000;

export function getDefaultRefreshMarketplaceTokensPayload(): RefreshMarketplaceTokensJobPayload {
  return refreshMarketplaceTokensJobSchema.parse({});
}

/**
 * Scheduled token refresh: renews Lazada access tokens that expire within the
 * configured window, before they lapse and break stock sync. Uses each
 * connection's stored refresh token; keeps the old refresh token when the
 * provider doesn't rotate it. Best-effort per connection — a dead refresh token
 * fails just that one (surfaced in the health dashboard as expired).
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

  if (!env.LAZADA_APP_KEY || !env.LAZADA_APP_SECRET) {
    logger.info('marketplace.token.refresh_skipped_unconfigured');
    stats.durationMs = Date.now() - startedAt;
    return stats;
  }

  const cutoff = new Date(Date.now() + payload.expiringWithinDays * DAY_MS);
  const connections = await findConnectionsForTokenRefresh(cutoff, payload.batchSize);

  for (const connection of connections) {
    stats.processed += 1;

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
      const refreshed = await refreshLazadaToken({
        appKey: env.LAZADA_APP_KEY,
        appSecret: env.LAZADA_APP_SECRET,
        baseUrl: env.LAZADA_API_BASE_URL ?? DEFAULT_BASE_URL,
        refreshToken,
      });

      const expiresAt =
        refreshed.expiresIn > 0 ? new Date(Date.now() + refreshed.expiresIn * 1000) : null;

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
