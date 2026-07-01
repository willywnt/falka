import { getServerEnv } from '@palka/config/env.server';
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
import {
  decryptAccessToken,
  isAccessTokenExpired,
  isTokenExpiringSoon,
  refreshAndPersistConnectionToken,
} from './token-access.js';

export type ExecuteStockSyncResult = {
  success: boolean;
  skipped?: boolean;
  errorCode?: string;
  retryable?: boolean;
};

/**
 * Returns a usable access token for the connection, PROACTIVELY refreshing it first when it's
 * expired or about to expire. Best-effort: a failed/absent refresh returns the existing token, and
 * the expiry gate + REACTIVE refresh in {@link executeStockSync} handle the rest. The shared token
 * logic (decrypt / expiry / refresh-and-persist) lives in token-access.ts (used by import + drift too).
 */
async function ensureFreshAccessToken(
  context: SyncJobContext,
): Promise<{ accessToken: string; tokenExpiresAt: Date | null }> {
  const secret = getServerEnv().MARKETPLACE_ENCRYPTION_SECRET;
  const accessToken = decryptAccessToken(context.encryptedAccessToken, secret, {
    connectionId: context.connectionId,
    provider: context.provider,
  });

  if (!isTokenExpiringSoon(context.tokenExpiresAt)) {
    return { accessToken, tokenExpiresAt: context.tokenExpiresAt };
  }

  const refreshed = await refreshAndPersistConnectionToken(
    {
      provider: context.provider,
      connectionId: context.connectionId,
      encryptedRefreshToken: context.encryptedRefreshToken,
      shopId: context.shopId,
    },
    secret,
  );
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
        const reAuthed = await refreshAndPersistConnectionToken(
          {
            provider: context.provider,
            connectionId: context.connectionId,
            encryptedRefreshToken: context.encryptedRefreshToken,
            shopId: context.shopId,
          },
          secret,
        );
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
