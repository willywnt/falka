import 'server-only';

import { getServerEnv } from '@palka/config/env.server';
import { isAuthLazadaError, isAuthShopeeError } from '@palka/marketplace-providers';
import { isTokenExpiringSoon, refreshAndPersistConnectionToken } from '@palka/queue';
import type { MarketplaceProvider } from '@prisma/client';

import { marketplaceEncryptionService } from './encryption.service';

type ConnectionForToken = {
  id: string;
  provider: MarketplaceProvider;
  encryptedAccessToken: string;
  encryptedRefreshToken: string | null;
  tokenExpiresAt: Date | null;
  shopId: string;
};

/**
 * Does a (wrapped) provider error message look like an auth/token rejection? The web adapters wrap
 * the raw provider error but keep its code in the message, so the per-provider classifier reads it.
 */
function looksLikeAuthFailure(provider: MarketplaceProvider, message: string): boolean {
  switch (provider) {
    case 'SHOPEE':
      return isAuthShopeeError(message);
    case 'LAZADA':
      return isAuthLazadaError(message, message);
    default:
      return false;
  }
}

/**
 * Run a provider operation with the connection's access token, refreshing it when needed — the SAME
 * proactive + reactive token handling the worker sync/import use, brought to the WEB on-demand paths
 * (drift check, order pull). PROACTIVE: refresh a near-expiry token before the call. REACTIVE: if the
 * provider rejects the token (a stored `tokenExpiresAt` can overstate the real life — seen on Shopee
 * sandbox), refresh once + retry. Refresh-and-persist is the shared {@link refreshAndPersistConnectionToken}
 * (@palka/queue), so worker + web behave identically; per-provider creds/refresh stay isolated there.
 */
export async function runWithFreshConnectionToken<T>(
  connection: ConnectionForToken,
  run: (accessToken: string) => Promise<T>,
): Promise<T> {
  const secret = getServerEnv().MARKETPLACE_ENCRYPTION_SECRET;
  const ref = {
    provider: connection.provider,
    connectionId: connection.id,
    encryptedRefreshToken: connection.encryptedRefreshToken,
    shopId: connection.shopId,
  };

  let accessToken =
    marketplaceEncryptionService.safeDecryptToken(connection.encryptedAccessToken) ?? '';

  // PROACTIVE: renew a near-expiry token before the call (Shopee's short TTL).
  if (isTokenExpiringSoon(connection.tokenExpiresAt)) {
    const fresh = await refreshAndPersistConnectionToken(ref, secret);
    if (fresh) accessToken = fresh.accessToken;
  }

  try {
    return await run(accessToken);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!looksLikeAuthFailure(connection.provider, message)) throw error;
    // REACTIVE: the provider rejected the token despite a "valid" stored expiry → refresh + retry once.
    const fresh = await refreshAndPersistConnectionToken(ref, secret);
    if (!fresh) throw error;
    return run(fresh.accessToken);
  }
}
