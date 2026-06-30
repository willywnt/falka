import { decrypt, encrypt } from '@palka/utils/crypto';
import { logger } from '@palka/utils/logger';
import type { MarketplaceProvider } from '@prisma/client';

import { applyRefreshedConnectionTokens } from './token-repository.js';
import { canRefreshProvider, refreshProviderToken } from './token-refresh.js';

/**
 * Shared marketplace access-token handling for EVERY worker operation that calls a provider with a
 * shop token — stock sync, listing import, drift. The two moves it gives them, uniformly:
 *  - PROACTIVE refresh-before-use when the stored expiry is near (see {@link isTokenExpiringSoon}).
 *  - REACTIVE refresh-and-retry when the provider rejects the token anyway — the stored
 *    `tokenExpiresAt` can OVERSTATE the real token life (observed on Shopee sandbox), so the
 *    proactive window never fires and the call would otherwise fail until a manual re-auth.
 * Per-provider refresh creds + the actual OAuth call live in token-refresh.ts; this only orchestrates.
 */

/** Refresh the access token if it expires within this window (covers Shopee's short ~hours TTL). */
export const TOKEN_REFRESH_SAFETY_MS = 10 * 60 * 1000;

/**
 * A connection's access token is expired when it carries an expiry at or before `now`. A null expiry
 * means "no expiry recorded" (stub/seed connections) and is treated as not-expired.
 */
export function isAccessTokenExpired(expiresAt: Date | null, now: Date = new Date()): boolean {
  return expiresAt !== null && expiresAt.getTime() <= now.getTime();
}

export function isTokenExpiringSoon(expiresAt: Date | null, now: Date = new Date()): boolean {
  return expiresAt !== null && expiresAt.getTime() <= now.getTime() + TOKEN_REFRESH_SAFETY_MS;
}

/**
 * Decrypt a stored access token leniently — seeded/stub connections store a non-cipher placeholder,
 * so a decrypt failure returns '' (the Dev stub ignores it; a real adapter surfaces its own auth
 * error) instead of throwing and failing every operation.
 */
export function decryptAccessToken(
  encryptedAccessToken: string,
  secret: string,
  ctx: { connectionId: string; provider: MarketplaceProvider },
): string {
  try {
    return decrypt(encryptedAccessToken, secret);
  } catch {
    logger.warn('marketplace.token.decrypt_failed', ctx);
    return '';
  }
}

export type ConnectionTokenRef = {
  provider: MarketplaceProvider;
  connectionId: string;
  encryptedRefreshToken: string | null;
  shopId: string;
};

/**
 * Refresh the connection's token via its stored refresh token and persist the result, returning the
 * new access token (or null when there's no refresh token / the provider can't refresh / it failed).
 * Best-effort: callers fall back to the existing token + their own error handling.
 */
export async function refreshAndPersistConnectionToken(
  input: ConnectionTokenRef,
  secret: string,
): Promise<{ accessToken: string; tokenExpiresAt: Date | null } | null> {
  if (!input.encryptedRefreshToken || !canRefreshProvider(input.provider)) return null;

  let refreshToken = '';
  try {
    refreshToken = decrypt(input.encryptedRefreshToken, secret);
  } catch {
    return null;
  }
  if (!refreshToken) return null;

  try {
    const refreshed = await refreshProviderToken({
      provider: input.provider,
      refreshToken,
      shopId: input.shopId,
    });
    const tokenExpiresAt =
      refreshed.expiresInSeconds > 0
        ? new Date(Date.now() + refreshed.expiresInSeconds * 1000)
        : null;

    await applyRefreshedConnectionTokens(input.connectionId, {
      encryptedAccessToken: encrypt(refreshed.accessToken, secret),
      // Keep the existing refresh token when the provider doesn't rotate it.
      encryptedRefreshToken: refreshed.refreshToken
        ? encrypt(refreshed.refreshToken, secret)
        : input.encryptedRefreshToken,
      tokenExpiresAt,
    });

    logger.info('marketplace.token.refreshed', {
      connectionId: input.connectionId,
      provider: input.provider,
    });

    return { accessToken: refreshed.accessToken, tokenExpiresAt };
  } catch (error) {
    logger.warn('marketplace.token.refresh_failed', {
      connectionId: input.connectionId,
      provider: input.provider,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}
