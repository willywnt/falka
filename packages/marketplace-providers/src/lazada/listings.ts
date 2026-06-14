import { isLazadaSuccess } from './client.js';
import type { LazadaClient } from './types.js';

const PRODUCTS_GET_PATH = '/products/get';
const PAGE_LIMIT = 50;
/** Safety cap so a paging bug can't loop forever (≈1000 listings). */
const MAX_PAGES = 20;

type LazadaApiSku = {
  SkuId?: number | string;
  SellerSku?: string;
  quantity?: number;
  Status?: string;
};

type LazadaApiProduct = {
  item_id?: number | string;
  status?: string;
  attributes?: { name?: string };
  skus?: LazadaApiSku[];
};

type LazadaProductsGetData = { products?: LazadaApiProduct[] };

/** A Lazada listing flattened to one row per SKU (the externalVariant grain). */
export type LazadaListingItem = {
  /** Lazada item_id — the external product id. */
  itemId: string;
  /** Lazada SkuId — the external variant id. */
  skuId: string;
  /** The seller's own SKU (Lazada SellerSku), if set. */
  sellerSku: string | null;
  productName: string;
  /** Sellable quantity Lazada currently reports for this SKU. */
  quantity: number;
  status: string;
  /** The raw `{ item_id, ...sku }` blob for logging/debugging. */
  raw: Record<string, unknown>;
};

/** A non-success LazOP envelope from a listings call, carrying the provider code. */
export class LazadaApiError extends Error {
  constructor(
    readonly code: string,
    readonly providerMessage?: string,
  ) {
    super(`Lazada API error (code ${code}${providerMessage ? `: ${providerMessage}` : ''})`);
    this.name = 'LazadaApiError';
  }
}

/**
 * Fetches a Lazada shop's live listings via the LazOP `/products/get` API, paging
 * until exhausted, and flattens them to one row per SKU. Shared by the web import
 * adapter (snapshot + auto-map) and the worker drift-reconciliation job (compare
 * external quantity vs internal available) so both read the same parsed shape.
 * Throws `LazadaApiError` on a non-success envelope — callers wrap it in their
 * own domain/sync error. The response shape (item_id / attributes.name /
 * skus[].SkuId/SellerSku/quantity) is verified against the live LazOP gateway.
 */
export async function fetchLazadaListings(
  client: LazadaClient,
  params: { accessToken: string },
): Promise<LazadaListingItem[]> {
  const items: LazadaListingItem[] = [];

  for (let page = 0; page < MAX_PAGES; page += 1) {
    const response = await client.call<LazadaProductsGetData>(PRODUCTS_GET_PATH, {
      method: 'GET',
      accessToken: params.accessToken,
      params: { filter: 'all', limit: PAGE_LIMIT, offset: page * PAGE_LIMIT },
    });

    if (!isLazadaSuccess(response)) {
      throw new LazadaApiError(response.code, response.message);
    }

    const products = response.data?.products ?? [];
    if (products.length === 0) break;

    for (const product of products) {
      const itemId = String(product.item_id ?? '');
      const productName = product.attributes?.name ?? 'Lazada product';

      for (const sku of product.skus ?? []) {
        const skuId = String(sku.SkuId ?? '');
        if (!itemId || !skuId) continue;

        items.push({
          itemId,
          skuId,
          sellerSku: sku.SellerSku ?? null,
          productName,
          quantity: typeof sku.quantity === 'number' ? sku.quantity : 0,
          status: sku.Status ?? product.status ?? 'active',
          raw: { item_id: product.item_id, ...sku } as Record<string, unknown>,
        });
      }
    }

    if (products.length < PAGE_LIMIT) break;
  }

  return items;
}
