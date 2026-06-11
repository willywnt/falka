import type { MarketplaceProvider } from '@prisma/client';
import type { LucideIcon } from 'lucide-react';
import { ShoppingBag, ShoppingCart, Store } from 'lucide-react';

export const MARKETPLACE_PROVIDER_LABELS: Record<MarketplaceProvider, string> = {
  SHOPEE: 'Shopee',
  TOKOPEDIA: 'Tokopedia',
  LAZADA: 'Lazada',
};

export const MARKETPLACE_PROVIDER_DESCRIPTIONS: Record<MarketplaceProvider, string> = {
  SHOPEE: 'Hubungkan toko seller Shopee kamu untuk sinkronisasi stok dan pesanan nanti.',
  TOKOPEDIA: 'Hubungkan toko Tokopedia kamu untuk sinkronisasi stok dan pesanan nanti.',
  LAZADA: 'Hubungkan toko seller Lazada kamu untuk sinkronisasi stok dan pesanan.',
};

export const MARKETPLACE_PROVIDER_ICONS: Record<MarketplaceProvider, LucideIcon> = {
  SHOPEE: ShoppingBag,
  TOKOPEDIA: Store,
  LAZADA: ShoppingCart,
};

export function getMarketplaceProviderLabel(provider: MarketplaceProvider): string {
  return MARKETPLACE_PROVIDER_LABELS[provider] ?? provider;
}

export function getMarketplaceProviderIcon(provider: MarketplaceProvider): LucideIcon {
  return MARKETPLACE_PROVIDER_ICONS[provider] ?? Store;
}
