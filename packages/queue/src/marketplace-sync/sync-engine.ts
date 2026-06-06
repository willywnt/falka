import { getServerEnv } from '@olshop/config/env.server';
import { decrypt } from '@olshop/utils/crypto';
import { logger } from '@olshop/utils/logger';

import { getProviderRateLimiter } from './rate-limit.js';
import { normalizeStockUpdateRequest } from './stock-normalizer.js';
import { getMarketplaceStockProvider } from './stock-provider.registry.js';
import {
  completeSyncJobSuccess,
  disableSyncJob,
  failSyncJob,
  loadSyncJobContext,
  markSyncJobProcessing,
} from './sync-repository.js';
import { MarketplaceSyncError } from './sync-errors.js';

export type ExecuteStockSyncResult = {
  success: boolean;
  skipped?: boolean;
  errorCode?: string;
  retryable?: boolean;
};

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

  await markSyncJobProcessing(syncJobId);

  try {
    await getProviderRateLimiter(context.provider).acquire();

    const adapter = getMarketplaceStockProvider(context.provider);
    const request = normalizeStockUpdateRequest({
      externalProductId: context.externalProductId,
      externalVariantId: context.externalVariantId,
      externalSku: context.externalSku,
      availableStock: context.availableStock,
    });

    // Real provider adapters need the DECRYPTED token; stub adapters ignore it.
    // Token-crypto is shared via @olshop/utils so the worker can open it here.
    // Fall back to an empty token when decryption fails (e.g. seeded/stub
    // connections whose stored value isn't real ciphertext) — the Dev stub
    // ignores it, and a real adapter surfaces its own auth error instead of
    // failing every job at this step.
    let accessToken = '';
    try {
      accessToken = decrypt(
        context.encryptedAccessToken,
        getServerEnv().MARKETPLACE_ENCRYPTION_SECRET,
      );
    } catch {
      logger.warn('marketplace.stock.token_decrypt_failed', {
        syncJobId,
        provider: context.provider,
      });
    }

    const response = await adapter.updateStock({ ...request, accessToken });

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
