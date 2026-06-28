import { getServerEnv } from '@palka/config/env.server';
import {
  buildShopeeStockUpdateBody,
  createShopeeClient,
  fetchShopeeItemsStock,
  fetchShopeeListings,
  isShopeeSuccess,
} from '@palka/marketplace-providers';
import type { ShopeeClient, ShopeeResponse } from '@palka/marketplace-providers';
import type { MarketplaceProvider } from '@prisma/client';

import type { NormalizedStockUpdateResponse } from '../stock-normalizer.js';
import type {
  MarketplaceStockProviderAdapter,
  ProviderListingSnapshot,
  ProviderShopCredentials,
  StockProviderUpdateParams,
} from '../stock-provider.registry.js';
import { MarketplaceSyncError, SYNC_ERROR_CODES } from '../sync-errors.js';

// Sets ABSOLUTE sellable stock via `seller_stock`; POST with the JSON body. Shopee shop-scoped
// calls require shop_id on every request (it's part of the signature base) — the sync engine
// passes it through `StockProviderUpdateParams.shopId`. Multi-location is non-destructive:
// with a syncWarehouseCode (location_id) only that location is written; others are omitted.
const UPDATE_STOCK_PATH = '/api/v2/product/update_stock';
const SHOP_INFO_PATH = '/api/v2/shop/get_shop_info';
const DEFAULT_BASE_URL = 'https://partner.shopeemobile.com';

/**
 * Maps a Shopee error envelope to a sync error. Shopee error codes are strings
 * (e.g. `error_auth`, `error_param`, `error_sign`, `error_server`). Auth errors are
 * non-retryable (re-auth needed); server/throttle errors are transient → retry; the
 * rest are caller/business rejections → non-retryable so we don't burn retries.
 */
function mapShopeeError(response: ShopeeResponse): MarketplaceSyncError {
  const code = response.error;
  const message = `Shopee rejected the request (${code}${
    response.message ? `: ${response.message}` : ''
  }).`;

  if (/auth|token/i.test(code)) {
    return new MarketplaceSyncError(SYNC_ERROR_CODES.INVALID_TOKEN, message, { retryable: false });
  }
  if (/server|busy|timeout|throttl|too_many|rate/i.test(code)) {
    return MarketplaceSyncError.syncFailed(message, true);
  }
  return MarketplaceSyncError.syncFailed(message, false);
}

function toSnapshot(item: {
  itemId: string;
  modelId: string;
  quantity: number;
  warehouses: { code: string; sellable: number }[];
}): ProviderListingSnapshot {
  return {
    externalProductId: item.itemId,
    externalVariantId: item.modelId,
    stock: item.quantity,
    warehouses: item.warehouses,
  };
}

/**
 * Pushes available stock to a Shopee listing via the Open Platform v2 update_stock API.
 * Real provider adapter — replaces the Dev stub once registered (see the worker bootstrap,
 * gated on SHOPEE_PARTNER_ID/KEY). The access token it receives is already decrypted by the
 * sync engine; the shop id comes from the connection.
 */
export class ShopeeStockProvider implements MarketplaceStockProviderAdapter {
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

  async updateStock(params: StockProviderUpdateParams): Promise<NormalizedStockUpdateResponse> {
    const response = await this.client.call(UPDATE_STOCK_PATH, {
      method: 'POST',
      accessToken: params.accessToken,
      shopId: params.shopId,
      params: buildShopeeStockUpdateBody(params),
    });

    if (!isShopeeSuccess(response)) {
      throw mapShopeeError(response);
    }

    return {
      success: true,
      externalStock: params.quantity,
      raw: response.raw,
    };
  }

  async validateStockSync(
    params: ProviderShopCredentials,
  ): Promise<{ ready: boolean; reason?: string }> {
    const response = await this.client.call(SHOP_INFO_PATH, {
      method: 'GET',
      accessToken: params.accessToken,
      shopId: params.shopId,
    });

    return isShopeeSuccess(response)
      ? { ready: true }
      : { ready: false, reason: response.message ?? `Shopee error ${response.error}` };
  }

  async fetchListings(params: ProviderShopCredentials): Promise<ProviderListingSnapshot[]> {
    const items = await fetchShopeeListings(this.client, params);
    return items.map(toSnapshot);
  }

  async fetchListingsForItems(
    params: ProviderShopCredentials & { externalProductIds: string[] },
  ): Promise<ProviderListingSnapshot[]> {
    const items = await fetchShopeeItemsStock(this.client, {
      accessToken: params.accessToken,
      shopId: params.shopId,
      itemIds: params.externalProductIds,
    });
    return items.map(toSnapshot);
  }
}
