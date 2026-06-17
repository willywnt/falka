import { getServerEnv } from '@falka/config/env.server';
import { refreshLazadaToken, refreshShopeeToken } from '@falka/marketplace-providers';
import type { MarketplaceProvider } from '@prisma/client';

const LAZADA_DEFAULT_BASE_URL = 'https://api.lazada.co.id/rest';
const SHOPEE_DEFAULT_BASE_URL = 'https://partner.shopeemobile.com';

export type RefreshedToken = {
  accessToken: string;
  /** New refresh token if the provider rotated it; null = keep the existing one. */
  refreshToken: string | null;
  /** access_token lifetime in seconds (0 = unknown). */
  expiresInSeconds: number;
};

/** Whether the worker has credentials configured to refresh the given provider. */
export function canRefreshProvider(provider: MarketplaceProvider): boolean {
  const env = getServerEnv();
  switch (provider) {
    case 'LAZADA':
      return Boolean(env.LAZADA_APP_KEY && env.LAZADA_APP_SECRET);
    case 'SHOPEE':
      return Boolean(env.SHOPEE_PARTNER_ID && env.SHOPEE_PARTNER_KEY);
    default:
      return false;
  }
}

/**
 * Refreshes one connection's access token via the right provider OAuth call. Shared by the
 * scheduled refresh job AND the lazy refresh-before-use in the sync engine — the latter matters
 * because Shopee access tokens last only ~4h, far shorter than the daily refresh cron. `shopId`
 * is required by shop-scoped providers (Shopee); Lazada embeds the shop in its token + ignores it.
 */
export async function refreshProviderToken(input: {
  provider: MarketplaceProvider;
  refreshToken: string;
  shopId: string;
}): Promise<RefreshedToken> {
  const env = getServerEnv();

  if (input.provider === 'LAZADA') {
    if (!env.LAZADA_APP_KEY || !env.LAZADA_APP_SECRET) {
      throw new Error('Lazada app credentials are not configured.');
    }
    const refreshed = await refreshLazadaToken({
      appKey: env.LAZADA_APP_KEY,
      appSecret: env.LAZADA_APP_SECRET,
      baseUrl: env.LAZADA_API_BASE_URL ?? LAZADA_DEFAULT_BASE_URL,
      refreshToken: input.refreshToken,
    });
    return {
      accessToken: refreshed.accessToken,
      refreshToken: refreshed.refreshToken || null,
      expiresInSeconds: refreshed.expiresIn,
    };
  }

  if (input.provider === 'SHOPEE') {
    if (!env.SHOPEE_PARTNER_ID || !env.SHOPEE_PARTNER_KEY) {
      throw new Error('Shopee app credentials are not configured.');
    }
    const refreshed = await refreshShopeeToken({
      partnerId: env.SHOPEE_PARTNER_ID,
      partnerKey: env.SHOPEE_PARTNER_KEY,
      baseUrl: env.SHOPEE_API_BASE_URL ?? SHOPEE_DEFAULT_BASE_URL,
      refreshToken: input.refreshToken,
      shopId: input.shopId,
    });
    return {
      accessToken: refreshed.accessToken,
      refreshToken: refreshed.refreshToken || null,
      expiresInSeconds: refreshed.expiresIn,
    };
  }

  throw new Error(`Token refresh is not supported for ${input.provider}.`);
}
