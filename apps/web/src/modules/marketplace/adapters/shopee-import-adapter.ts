import 'server-only';

import { getServerEnv } from '@falka/config/env.server';
import {
  createShopeeClient,
  fetchShopeeItemsStock,
  fetchShopeeListings,
  ShopeeApiError,
} from '@falka/marketplace-providers';
import type { ShopeeClient, ShopeeListingItem } from '@falka/marketplace-providers';
import type { MarketplaceProvider } from '@prisma/client';

import { MarketplaceError } from '../errors/marketplace-errors';
import type { MarketplaceImportAdapter, NormalizedListing } from './import-adapter';

const DEFAULT_BASE_URL = 'https://partner.shopeemobile.com';

function toNormalizedListings(items: ShopeeListingItem[]): NormalizedListing[] {
  return items.map((item) => ({
    externalProductId: item.itemId,
    externalVariantId: item.modelId,
    externalSku: item.modelSku,
    externalProductName: item.productName,
    externalVariantName: item.variantName,
    stock: item.quantity,
    warehouses: item.warehouses,
    status: item.status,
    raw: item.raw,
  }));
}

function wrapShopeeError(error: unknown): never {
  if (error instanceof ShopeeApiError) {
    throw MarketplaceError.validation(
      `Shopee import failed (${error.code}${
        error.providerMessage ? `: ${error.providerMessage}` : ''
      }).`,
    );
  }
  throw error;
}

/**
 * Imports a Shopee shop's live listings via the shared Shopee fetchers, mapping each model
 * to our cross-provider {@link NormalizedListing}. Real provider adapter — replaces the stub
 * for SHOPEE once SHOPEE_PARTNER_ID/KEY are configured. Shop-scoped calls need shop_id, which
 * the import/reconciliation services supply from the connection.
 */
export class ShopeeImportAdapter implements MarketplaceImportAdapter {
  readonly provider: MarketplaceProvider = 'SHOPEE';
  private readonly client: ShopeeClient;

  constructor() {
    const env = getServerEnv();
    this.client = createShopeeClient({
      partnerId: env.SHOPEE_PARTNER_ID ?? '',
      partnerKey: env.SHOPEE_PARTNER_KEY ?? '',
      baseUrl: env.SHOPEE_API_BASE_URL ?? DEFAULT_BASE_URL,
    });
  }

  async fetchListings(params: {
    shopId: string;
    accessToken: string;
  }): Promise<NormalizedListing[]> {
    try {
      const items = await fetchShopeeListings(this.client, {
        accessToken: params.accessToken,
        shopId: params.shopId,
      });
      return toNormalizedListings(items);
    } catch (error) {
      wrapShopeeError(error);
    }
  }

  async fetchListingsForItems(params: {
    shopId: string;
    accessToken: string;
    externalProductIds: string[];
  }): Promise<NormalizedListing[]> {
    try {
      const items = await fetchShopeeItemsStock(this.client, {
        accessToken: params.accessToken,
        shopId: params.shopId,
        itemIds: params.externalProductIds,
      });
      return toNormalizedListings(items);
    } catch (error) {
      wrapShopeeError(error);
    }
  }
}
