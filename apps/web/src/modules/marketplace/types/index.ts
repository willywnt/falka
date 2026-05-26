import type { MarketplaceProvider } from '@prisma/client';

import type { TokenStatus } from '../utils/token-lifecycle';

export type MarketplaceConnectionStatus = 'connected' | 'disconnected' | 'expired';

export type MarketplaceConnectionListItem = {
  id: string;
  provider: MarketplaceProvider;
  shopId: string;
  shopName: string;
  isActive: boolean;
  tokenExpiresAt: string | null;
  tokenStatus: TokenStatus;
  connectionStatus: MarketplaceConnectionStatus;
  createdAt: string;
  updatedAt: string;
};

export type MarketplaceConnectionDetail = MarketplaceConnectionListItem;

export const MARKETPLACE_CONNECTION_STATUS_LABELS: Record<MarketplaceConnectionStatus, string> = {
  connected: 'Connected',
  disconnected: 'Disconnected',
  expired: 'Token expired',
};
