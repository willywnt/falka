import 'server-only';

import { getServerEnv } from '@falka/config/env.server';
import {
  buildTikTokAuthUrl,
  createTikTokClient,
  exchangeTikTokCode,
  fetchTikTokShops,
  refreshTikTokToken,
} from '@falka/marketplace-providers';
import { MarketplaceProvider } from '@prisma/client';

import { appLogger } from '@/lib/logger';

import { MarketplaceError } from '../errors/marketplace-errors';
import { decodeOAuthState, encodeOAuthState } from '../utils/oauth-state';
import { marketplaceServerService } from './marketplace-server.service';

const DEFAULT_BASE_URL = 'https://open-api.tiktokglobalshop.com';

/**
 * Tokopedia OAuth onboarding — runs on the TikTok Shop Open API (the standalone Tokopedia API
 * was terminated). The seller is redirected to the authorization page (carrying our encrypted
 * state); the callback swaps the code for tokens, then resolves the shop_cipher from
 * `/authorization/202309/shops` and persists it on the connection (every shop-scoped call needs
 * it). Mirrors {@link lazadaOAuthService}/{@link shopeeOAuthService}; reuses the OAuth-state helpers.
 *
 * ⚠ Verify the authorize/token hosts + the shops payload against the live Partner Center docs
 * once sandbox access lands (see the @falka/marketplace-providers tiktok client).
 */
class TokopediaOAuthService {
  /** Build the seller-authorization URL (state encrypts org + actor; redirect is app-registered). */
  buildAuthorizeUrl(input: { organizationId: string; actorUserId: string }): string {
    const env = getServerEnv();
    if (!env.TOKOPEDIA_APP_KEY || !env.TOKOPEDIA_APP_SECRET || !env.TOKOPEDIA_SERVICE_ID) {
      throw MarketplaceError.validation(
        'Tokopedia (TikTok Shop) OAuth belum dikonfigurasi (TOKOPEDIA_APP_KEY / TOKOPEDIA_APP_SECRET / TOKOPEDIA_SERVICE_ID).',
      );
    }

    return buildTikTokAuthUrl({
      serviceId: env.TOKOPEDIA_SERVICE_ID,
      state: encodeOAuthState(input, env.MARKETPLACE_ENCRYPTION_SECRET),
    });
  }

  /** Exchange the callback code (validating state), resolve shop_cipher, create the connection. */
  async handleCallback(input: { code: string; state: string }): Promise<{ connectionId: string }> {
    const env = getServerEnv();
    const { organizationId, actorUserId } = decodeOAuthState(
      input.state,
      env.MARKETPLACE_ENCRYPTION_SECRET,
    );

    if (!env.TOKOPEDIA_APP_KEY || !env.TOKOPEDIA_APP_SECRET) {
      throw MarketplaceError.validation(
        'Kredensial app Tokopedia (TikTok Shop) belum dikonfigurasi.',
      );
    }

    const token = await exchangeTikTokCode({
      appKey: env.TOKOPEDIA_APP_KEY,
      appSecret: env.TOKOPEDIA_APP_SECRET,
      code: input.code,
    });

    // Resolve the shop (+ its shop_cipher) the token is authorized for — every shop-scoped call needs it.
    const client = createTikTokClient({
      appKey: env.TOKOPEDIA_APP_KEY,
      appSecret: env.TOKOPEDIA_APP_SECRET,
      baseUrl: env.TOKOPEDIA_API_BASE_URL ?? DEFAULT_BASE_URL,
    });
    const shops = await fetchTikTokShops(client, { accessToken: token.accessToken });
    const shop = shops[0];
    if (!shop) {
      throw MarketplaceError.validation(
        'Tidak ada toko TikTok Shop yang terotorisasi untuk akun ini.',
      );
    }

    const expiresAt = token.expiresIn > 0 ? new Date(Date.now() + token.expiresIn * 1000) : null;

    const connection = await marketplaceServerService.upsertOAuthConnection(
      organizationId,
      actorUserId,
      {
        provider: MarketplaceProvider.TOKOPEDIA,
        shopId: shop.id,
        shopName: shop.name,
        shopCipher: shop.cipher,
        accessToken: token.accessToken,
        refreshToken: token.refreshToken || undefined,
        expiresAt,
      },
    );

    appLogger.info('marketplace.tokopedia.oauth.connected', {
      organizationId,
      connectionId: connection.id,
      shopId: shop.id,
    });

    return { connectionId: connection.id };
  }

  /** Renew a connection's access token from its stored refresh token (cipher not needed). */
  async refreshConnection(
    organizationId: string,
    actorUserId: string,
    connectionId: string,
  ): Promise<void> {
    const env = getServerEnv();
    if (!env.TOKOPEDIA_APP_KEY || !env.TOKOPEDIA_APP_SECRET) {
      throw MarketplaceError.validation(
        'Kredensial app Tokopedia (TikTok Shop) belum dikonfigurasi.',
      );
    }

    const tokens = await marketplaceServerService.getDecryptedTokens(organizationId, connectionId);
    if (tokens.provider !== MarketplaceProvider.TOKOPEDIA) {
      throw MarketplaceError.validation('Hanya koneksi Tokopedia yang didukung di sini.');
    }
    if (!tokens.refreshToken) {
      throw MarketplaceError.validation('Tidak ada refresh token tersimpan untuk koneksi ini.');
    }

    const refreshed = await refreshTikTokToken({
      appKey: env.TOKOPEDIA_APP_KEY,
      appSecret: env.TOKOPEDIA_APP_SECRET,
      refreshToken: tokens.refreshToken,
    });

    const expiresAt =
      refreshed.expiresIn > 0 ? new Date(Date.now() + refreshed.expiresIn * 1000) : null;

    await marketplaceServerService.applyRefreshedTokens(organizationId, actorUserId, connectionId, {
      accessToken: refreshed.accessToken,
      refreshToken: refreshed.refreshToken || null,
      expiresAt,
    });

    appLogger.info('marketplace.tokopedia.oauth.refreshed', { organizationId, connectionId });
  }

  /** Probe a connection's token with the shops lookup (token-scoped) so the user can verify it. */
  async testConnection(
    organizationId: string,
    connectionId: string,
  ): Promise<{ ready: boolean; reason?: string }> {
    const env = getServerEnv();
    if (!env.TOKOPEDIA_APP_KEY || !env.TOKOPEDIA_APP_SECRET) {
      throw MarketplaceError.validation(
        'Kredensial app Tokopedia (TikTok Shop) belum dikonfigurasi.',
      );
    }

    const tokens = await marketplaceServerService.getDecryptedTokens(organizationId, connectionId);
    if (tokens.provider !== MarketplaceProvider.TOKOPEDIA) {
      throw MarketplaceError.validation('Hanya koneksi Tokopedia yang bisa dites di sini.');
    }

    const client = createTikTokClient({
      appKey: env.TOKOPEDIA_APP_KEY,
      appSecret: env.TOKOPEDIA_APP_SECRET,
      baseUrl: env.TOKOPEDIA_API_BASE_URL ?? DEFAULT_BASE_URL,
    });

    try {
      await fetchTikTokShops(client, { accessToken: tokens.accessToken });
      return { ready: true };
    } catch (error) {
      return {
        ready: false,
        reason: error instanceof Error ? error.message : 'Token tidak valid.',
      };
    }
  }
}

export const tokopediaOAuthService = new TokopediaOAuthService();
