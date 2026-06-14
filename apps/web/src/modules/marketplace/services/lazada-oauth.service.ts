import 'server-only';

import { getServerEnv } from '@falka/config/env.server';
import {
  createLazadaClient,
  exchangeLazadaCode,
  isLazadaSuccess,
  refreshLazadaToken,
} from '@falka/marketplace-providers';
import { MarketplaceProvider } from '@prisma/client';

import { appLogger } from '@/lib/logger';

import { MarketplaceError } from '../errors/marketplace-errors';
import { decodeOAuthState, encodeOAuthState } from '../utils/oauth-state';
import { marketplaceServerService } from './marketplace-server.service';

const LAZADA_AUTHORIZE_URL = 'https://auth.lazada.com/oauth/authorize';
const DEFAULT_BASE_URL = 'https://api.lazada.co.id/rest';

/**
 * Lazada OAuth onboarding (multi-seller): the authorize route sends the seller to Lazada
 * with an encrypted state carrying the connecting org + actor; the callback swaps the code
 * for tokens and creates the org-scoped connection. The seller never pastes a token.
 */
class LazadaOAuthService {
  /** Build the auth.lazada.com consent URL (state encrypts org + actor). */
  buildAuthorizeUrl(input: { organizationId: string; actorUserId: string }): string {
    const env = getServerEnv();
    if (!env.LAZADA_APP_KEY || !env.LAZADA_OAUTH_REDIRECT_URI) {
      throw MarketplaceError.validation(
        'Lazada OAuth belum dikonfigurasi (LAZADA_APP_KEY / LAZADA_OAUTH_REDIRECT_URI).',
      );
    }

    const params = new URLSearchParams({
      response_type: 'code',
      force_auth: 'true',
      client_id: env.LAZADA_APP_KEY,
      redirect_uri: env.LAZADA_OAUTH_REDIRECT_URI,
      state: encodeOAuthState(input, env.MARKETPLACE_ENCRYPTION_SECRET),
    });

    return `${LAZADA_AUTHORIZE_URL}?${params.toString()}`;
  }

  /** Exchange the callback code (validating state) and create the org-scoped connection. */
  async handleCallback(input: { code: string; state: string }): Promise<{ connectionId: string }> {
    const env = getServerEnv();
    const { organizationId, actorUserId } = decodeOAuthState(
      input.state,
      env.MARKETPLACE_ENCRYPTION_SECRET,
    );

    if (!env.LAZADA_APP_KEY || !env.LAZADA_APP_SECRET) {
      throw MarketplaceError.validation('Kredensial app Lazada belum dikonfigurasi.');
    }

    const token = await exchangeLazadaCode({
      appKey: env.LAZADA_APP_KEY,
      appSecret: env.LAZADA_APP_SECRET,
      baseUrl: env.LAZADA_API_BASE_URL ?? DEFAULT_BASE_URL,
      code: input.code,
    });

    const seller = token.countryUserInfo[0];
    const shopId = seller?.seller_id ?? seller?.short_code ?? token.account ?? 'lazada';
    const shopName = token.account ?? `Lazada ${seller?.short_code ?? shopId}`;
    const expiresAt = token.expiresIn > 0 ? new Date(Date.now() + token.expiresIn * 1000) : null;

    const connection = await marketplaceServerService.createConnection(
      organizationId,
      actorUserId,
      {
        provider: MarketplaceProvider.LAZADA,
        shopId,
        shopName,
        accessToken: token.accessToken,
        refreshToken: token.refreshToken || undefined,
        expiresAt,
      },
    );

    appLogger.info('marketplace.lazada.oauth.connected', {
      organizationId,
      connectionId: connection.id,
      shopId,
    });

    return { connectionId: connection.id };
  }

  /** Renew a connection's access token from its stored refresh token (re-seal + new expiry). */
  async refreshConnection(
    organizationId: string,
    actorUserId: string,
    connectionId: string,
  ): Promise<void> {
    const env = getServerEnv();
    if (!env.LAZADA_APP_KEY || !env.LAZADA_APP_SECRET) {
      throw MarketplaceError.validation('Kredensial app Lazada belum dikonfigurasi.');
    }

    const tokens = await marketplaceServerService.getDecryptedTokens(organizationId, connectionId);
    if (tokens.provider !== MarketplaceProvider.LAZADA) {
      throw MarketplaceError.validation('Hanya koneksi Lazada yang mendukung refresh token.');
    }
    if (!tokens.refreshToken) {
      throw MarketplaceError.validation('Tidak ada refresh token tersimpan untuk koneksi ini.');
    }

    const refreshed = await refreshLazadaToken({
      appKey: env.LAZADA_APP_KEY,
      appSecret: env.LAZADA_APP_SECRET,
      baseUrl: env.LAZADA_API_BASE_URL ?? DEFAULT_BASE_URL,
      refreshToken: tokens.refreshToken,
    });

    const expiresAt =
      refreshed.expiresIn > 0 ? new Date(Date.now() + refreshed.expiresIn * 1000) : null;

    await marketplaceServerService.applyRefreshedTokens(organizationId, actorUserId, connectionId, {
      accessToken: refreshed.accessToken,
      refreshToken: refreshed.refreshToken || null,
      expiresAt,
    });

    appLogger.info('marketplace.lazada.oauth.refreshed', { organizationId, connectionId });
  }

  /** Probe a connection's token with GET /seller/get so the user can verify it before relying on it. */
  async testConnection(
    organizationId: string,
    connectionId: string,
  ): Promise<{ ready: boolean; reason?: string }> {
    const env = getServerEnv();
    if (!env.LAZADA_APP_KEY || !env.LAZADA_APP_SECRET) {
      throw MarketplaceError.validation('Kredensial app Lazada belum dikonfigurasi.');
    }

    const tokens = await marketplaceServerService.getDecryptedTokens(organizationId, connectionId);
    if (tokens.provider !== MarketplaceProvider.LAZADA) {
      throw MarketplaceError.validation('Hanya koneksi Lazada yang bisa dites.');
    }

    const client = createLazadaClient({
      appKey: env.LAZADA_APP_KEY,
      appSecret: env.LAZADA_APP_SECRET,
      baseUrl: env.LAZADA_API_BASE_URL ?? DEFAULT_BASE_URL,
    });
    const response = await client.call('/seller/get', {
      method: 'GET',
      accessToken: tokens.accessToken,
    });

    return isLazadaSuccess(response)
      ? { ready: true }
      : { ready: false, reason: response.message ?? `Lazada error ${response.code}` };
  }
}

export const lazadaOAuthService = new LazadaOAuthService();
