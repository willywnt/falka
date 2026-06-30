import { getServerEnv } from '@palka/config/env.server';
import { decrypt, encrypt } from '@palka/utils/crypto';
import { logger } from '@palka/utils/logger';

import { acquireProviderToken } from './provider-rate-limit-redis.js';
import {
  normalizeStockUpdateRequest,
  type NormalizedStockUpdateResponse,
} from './stock-normalizer.js';
import { getMarketplaceStockProvider } from './stock-provider.registry.js';
import {
  completeSyncJobSuccess,
  disableSyncJob,
  failSyncJob,
  loadSyncJobContext,
  markSyncJobProcessing,
  pauseMappingForInvalidListing,
  type SyncJobContext,
} from './sync-repository.js';
import { MarketplaceSyncError, SYNC_ERROR_CODES } from './sync-errors.js';
import { applyRefreshedConnectionTokens } from './token-repository.js';
import { canRefreshProvider, refreshProviderToken } from './token-refresh.js';

/**
 * Refresh the access token if it expires within this window. Short-TTL providers (Shopee
 * ~4h) would otherwise be expired most of the day, since the refresh cron runs only daily.
 */
const TOKEN_REFRESH_SAFETY_MS = 10 * 60 * 1000;

export type ExecuteStockSyncResult = {
  success: boolean;
  skipped?: boolean;
  errorCode?: string;
  retryable?: boolean;
};

/**
 * A connection's access token is expired when it carries an expiry that is at or
 * before `now`. A null expiry means "no expiry recorded" (stub/seed connections)
 * and is treated as not-expired so the existing flows are unaffected.
 */
export function isAccessTokenExpired(expiresAt: Date | null, now: Date = new Date()): boolean {
  return expiresAt !== null && expiresAt.getTime() <= now.getTime();
}

function isTokenExpiringSoon(expiresAt: Date | null, now: Date = new Date()): boolean {
  return expiresAt !== null && expiresAt.getTime() <= now.getTime() + TOKEN_REFRESH_SAFETY_MS;
}

/**
 * Refresh the connection's token via its stored refresh token and persist the result, returning the
 * new access token (or null when there's no refresh token / the provider can't refresh / it failed).
 * Shared by the PROACTIVE refresh-before-use ({@link ensureFreshAccessToken}) and the REACTIVE
 * refresh-on-auth-failure in {@link executeStockSync}. The reactive path is load-bearing because a
 * provider's stored `tokenExpiresAt` can OVERSTATE the real token life (observed on Shopee sandbox:
 * the token dies well before its recorded expiry), so the proactive window never fires and the push
 * would otherwise fail with INVALID_TOKEN until a manual re-auth.
 */
async function refreshAndPersistToken(
  context: SyncJobContext,
  secret: string,
): Promise<{ accessToken: string; tokenExpiresAt: Date | null } | null> {
  if (!context.encryptedRefreshToken || !canRefreshProvider(context.provider)) return null;

  let refreshToken = '';
  try {
    refreshToken = decrypt(context.encryptedRefreshToken, secret);
  } catch {
    return null;
  }
  if (!refreshToken) return null;

  try {
    const refreshed = await refreshProviderToken({
      provider: context.provider,
      refreshToken,
      shopId: context.shopId,
    });
    const tokenExpiresAt =
      refreshed.expiresInSeconds > 0
        ? new Date(Date.now() + refreshed.expiresInSeconds * 1000)
        : null;

    await applyRefreshedConnectionTokens(context.connectionId, {
      encryptedAccessToken: encrypt(refreshed.accessToken, secret),
      // Keep the existing refresh token when the provider doesn't rotate it.
      encryptedRefreshToken: refreshed.refreshToken
        ? encrypt(refreshed.refreshToken, secret)
        : context.encryptedRefreshToken,
      tokenExpiresAt,
    });

    logger.info('marketplace.stock.token_refreshed', {
      connectionId: context.connectionId,
      provider: context.provider,
    });

    return { accessToken: refreshed.accessToken, tokenExpiresAt };
  } catch (error) {
    logger.warn('marketplace.stock.token_refresh_failed', {
      connectionId: context.connectionId,
      provider: context.provider,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

/**
 * Returns a usable access token for the connection, PROACTIVELY refreshing it first when it's
 * expired or about to expire (within {@link TOKEN_REFRESH_SAFETY_MS}). Best-effort: a failed/absent
 * refresh returns the existing (decrypted) token, and the expiry gate + REACTIVE refresh in
 * {@link executeStockSync} handle the rest. Lazada (~30d) is a no-op on the hot path; this exists for
 * short-TTL providers like Shopee.
 */
async function ensureFreshAccessToken(
  context: SyncJobContext,
): Promise<{ accessToken: string; tokenExpiresAt: Date | null }> {
  const secret = getServerEnv().MARKETPLACE_ENCRYPTION_SECRET;

  let accessToken = '';
  try {
    accessToken = decrypt(context.encryptedAccessToken, secret);
  } catch {
    // Seeded/stub connections store a non-cipher placeholder — the Dev stub ignores the token,
    // and a real adapter surfaces its own auth error rather than failing every job here.
    logger.warn('marketplace.stock.token_decrypt_failed', {
      connectionId: context.connectionId,
      provider: context.provider,
    });
  }

  if (!isTokenExpiringSoon(context.tokenExpiresAt)) {
    return { accessToken, tokenExpiresAt: context.tokenExpiresAt };
  }

  const refreshed = await refreshAndPersistToken(context, secret);
  return refreshed ?? { accessToken, tokenExpiresAt: context.tokenExpiresAt };
}

/**
 * Pushes a single mapping's current available stock to its marketplace listing.
 * Reads the LATEST available stock so repeated events converge to the truth.
 * Returns a result; the caller (job processor) decides whether to throw for a
 * BullMQ retry based on `retryable`.
 */
export async function executeStockSync(
  syncJobId: string,
  attemptNumber: number,
  maxAttempts: number,
): Promise<ExecuteStockSyncResult> {
  const context = await loadSyncJobContext(syncJobId);
  if (!context) return { success: false, skipped: true };

  if (
    !context.syncEnabled ||
    !context.connectionActive ||
    context.productDeleted ||
    context.variantDeleted
  ) {
    await disableSyncJob({ syncJobId, reason: 'Mapping is no longer sync-eligible.' });
    return { success: false, skipped: true };
  }

  // Refresh-before-use: short-TTL providers (Shopee ~4h) would otherwise be expired most of
  // the day since the cron runs daily. Best-effort — refreshes + persists when expiring soon,
  // else returns the current token. Lazada (~30d) is untouched on the hot path.
  const fresh = await ensureFreshAccessToken(context);

  // Reject an expired token BEFORE touching the provider: a real adapter would
  // otherwise burn a network call and a non-retryable failure on every mapping.
  // Unlike the eligibility gate above we FAIL (not DISABLE) the job — once the
  // token is refreshed the mapping is sync-eligible again and a fresh event syncs.
  if (isAccessTokenExpired(fresh.tokenExpiresAt)) {
    const error = MarketplaceSyncError.tokenExpired();
    await failSyncJob({
      syncJobId,
      mappingId: context.mappingId,
      errorMessage: error.message,
      finalFailure: true,
    });
    logger.warn('marketplace.stock.token_expired', {
      syncJobId,
      provider: context.provider,
    });
    return { success: false, errorCode: error.code, retryable: false };
  }

  await markSyncJobProcessing(syncJobId);

  const secret = getServerEnv().MARKETPLACE_ENCRYPTION_SECRET;
  const adapter = getMarketplaceStockProvider(context.provider);
  const request = normalizeStockUpdateRequest({
    externalProductId: context.externalProductId,
    externalVariantId: context.externalVariantId,
    externalSku: context.externalSku,
    availableStock: context.availableStock,
    syncWarehouseCode: context.syncWarehouseCode,
  });

  // Push the latest available stock for `token`, pacing the provider call through the shared
  // per-shop/per-app Redis budget. Stub adapters ignore the token; shop-scoped providers (Shopee)
  // need shop_id (+ shopCipher for TikTok/Tokopedia).
  let accessToken = fresh.accessToken;
  const pushStock = async (token: string): Promise<NormalizedStockUpdateResponse> => {
    await acquireProviderToken(context.provider, context.shopId);
    return adapter.updateStock({
      ...request,
      accessToken: token,
      shopId: context.shopId,
      shopCipher: context.shopCipher,
    });
  };

  try {
    let response: NormalizedStockUpdateResponse;
    try {
      response = await pushStock(accessToken);
    } catch (error) {
      // REACTIVE refresh-on-auth-failure: the stored tokenExpiresAt can overstate the real token
      // life (Shopee sandbox), so ensureFreshAccessToken may not have refreshed. On an INVALID_TOKEN
      // rejection, refresh once and retry — self-healing instead of failing until a manual re-auth.
      if (error instanceof MarketplaceSyncError && error.code === SYNC_ERROR_CODES.INVALID_TOKEN) {
        const reAuthed = await refreshAndPersistToken(context, secret);
        if (!reAuthed) throw error;
        accessToken = reAuthed.accessToken;
        logger.info('marketplace.stock.token_reactive_refreshed', {
          syncJobId,
          provider: context.provider,
        });
        response = await pushStock(accessToken);
      } else {
        throw error;
      }
    }

    if (!response.success) {
      throw MarketplaceSyncError.syncFailed('Provider rejected the stock update.');
    }

    await completeSyncJobSuccess({
      syncJobId,
      mappingId: context.mappingId,
      marketplaceProductId: context.marketplaceProductId,
      externalStock: response.externalStock,
      providerResponse: response.raw ?? {},
    });

    logger.info('marketplace.stock.synced', {
      syncJobId,
      provider: context.provider,
      quantity: request.quantity,
    });

    return { success: true };
  } catch (error) {
    const isSyncError = error instanceof MarketplaceSyncError;
    const retryable = isSyncError ? error.retryable : true;
    const errorCode = isSyncError ? error.code : 'SYNC_FAILED';
    const message = error instanceof Error ? error.message : String(error);
    const finalFailure = !retryable || attemptNumber >= maxAttempts;

    await failSyncJob({
      syncJobId,
      mappingId: context.mappingId,
      errorMessage: message,
      finalFailure,
    });

    // The listing/model is gone or no longer matches → pause this mapping (syncEnabled off +
    // NEEDS_REVIEW) so it stops re-enqueuing on every future SoT change / drift push and instead
    // surfaces for re-mapping. Our internal data is untouched; a re-import that re-confirms the
    // mapping re-enables it.
    if (errorCode === SYNC_ERROR_CODES.MAPPING_INVALID) {
      await pauseMappingForInvalidListing({ mappingId: context.mappingId, reason: message });
      logger.warn('marketplace.stock.mapping_auto_paused', {
        syncJobId,
        provider: context.provider,
        mappingId: context.mappingId,
      });
    }

    logger.warn('marketplace.stock.sync_failed', {
      syncJobId,
      provider: context.provider,
      errorCode,
      retryable,
      finalFailure,
    });

    return { success: false, errorCode, retryable };
  }
}
