import { getServerEnv } from '@palka/config/env.server';
import {
  buildShopeeStockUpdateBody,
  createShopeeClient,
  fetchShopeeItemsStock,
  fetchShopeeListings,
  isAuthShopeeError,
  isShopeeSuccess,
  isTransientShopeeError,
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
 * The per-model result Shopee returns from update_stock. A model can land in `failure_list`
 * (with a `failed_reason`) even when the envelope `error` is empty — an empty envelope is NOT
 * proof the stock write applied.
 */
type ShopeeUpdateStockResult = {
  failure_list?: Array<{ model_id?: number | string; failed_reason?: string }>;
};

/**
 * Maps a Shopee error envelope to a sync error. Shopee error codes are strings
 * (e.g. `error_auth`, `error_param`, `error_sign`, `error_server`, `error_rate_limit`). Auth
 * errors are non-retryable (re-auth needed); the tiered throttle codes (per-shop/per-app/per-API
 * QPS + the daily `error_limit`) are transient → retry; the rest are caller/business rejections →
 * non-retryable so we don't burn retries. Throttle/auth classification is single-sourced in
 * `@palka/marketplace-providers` so the order pull + stock sync agree.
 */
function mapShopeeError(response: ShopeeResponse): MarketplaceSyncError {
  const code = response.error;
  const message = `Shopee rejected the request (${code}${
    response.message ? `: ${response.message}` : ''
  }).`;

  if (isAuthShopeeError(code)) {
    return new MarketplaceSyncError(SYNC_ERROR_CODES.INVALID_TOKEN, message, { retryable: false });
  }
  if (isTransientShopeeError(code, response.message)) {
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
    const response = await this.client.call<ShopeeUpdateStockResult>(UPDATE_STOCK_PATH, {
      method: 'POST',
      accessToken: params.accessToken,
      shopId: params.shopId,
      params: buildShopeeStockUpdateBody(params),
    });

    if (!isShopeeSuccess(response)) {
      throw mapShopeeError(response);
    }

    // Shopee can REJECT the model per-row in `failure_list` even on an empty envelope `error`.
    // We push exactly one model, so any failure means this write did NOT apply — surface it (else
    // a rejected push is silently recorded as synced and the next drift check flags phantom drift).
    const failures = response.response?.failure_list ?? [];
    if (failures.length > 0) {
      const reason = failures
        .map((entry) => entry.failed_reason)
        .filter((value): value is string => Boolean(value && value.trim()))
        .join('; ');
      // Usually a business reason (item not editable, invalid stock) → non-retryable; retry only
      // when the reason text itself reads transient.
      throw MarketplaceSyncError.syncFailed(
        `Shopee update_stock rejected the model${reason ? ` (${reason})` : ''}.`,
        isTransientShopeeError('', reason),
      );
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
