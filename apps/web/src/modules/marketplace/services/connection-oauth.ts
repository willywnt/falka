import 'server-only';

import type { MarketplaceProvider } from '@prisma/client';

import { lazadaOAuthService } from './lazada-oauth.service';
import { shopeeOAuthService } from './shopee-oauth.service';
import { tokopediaOAuthService } from './tokopedia-oauth.service';

/**
 * The per-connection OAuth operations shared by every real provider (test + refresh).
 * The authorize/callback flows differ per provider (own routes), but test/refresh have
 * the same shape, so the [id]/test + [id]/refresh routes dispatch through here by provider.
 */
export type ConnectionOAuthService = {
  testConnection(
    organizationId: string,
    connectionId: string,
  ): Promise<{ ready: boolean; reason?: string }>;
  refreshConnection(
    organizationId: string,
    actorUserId: string,
    connectionId: string,
  ): Promise<void>;
};

/** The OAuth lifecycle service for a connection's provider, or null for token-only providers. */
export function getConnectionOAuthService(
  provider: MarketplaceProvider,
): ConnectionOAuthService | null {
  switch (provider) {
    case 'LAZADA':
      return lazadaOAuthService;
    case 'SHOPEE':
      return shopeeOAuthService;
    case 'TOKOPEDIA':
      return tokopediaOAuthService;
    default:
      return null;
  }
}
