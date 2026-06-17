import { isTikTokSuccess } from './client.js';
import type { TikTokClient } from './types.js';

const PRODUCT_SEARCH_PATH = '/product/202309/products/search';
const productDetailPath = (productId: string): string => `/product/202309/products/${productId}`;

const PAGE_SIZE = 50;
/** Safety cap so a paging bug can't loop forever (≈2000 listings). */
const MAX_PAGES = 40;
/** Gentle pacing so a large catalog stays under TikTok's per-app QPS. */
const CALL_DELAY_MS = 250;

/** Postgres INT4 ceiling — our stock columns are 32-bit; clamp absurd provider values. */
const INT32_MAX = 2_147_483_647;

function clampStock(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(INT32_MAX, Math.floor(value)));
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** One warehouse's current quantity for a SKU (TikTok `inventory[]`). */
export type TikTokWarehouseStock = {
  code: string;
  sellable: number;
};

/** A TikTok Shop listing flattened to one row per SKU (the externalVariant grain). */
export type TikTokListingItem = {
  /** TikTok product id — the external product id. */
  productId: string;
  /** TikTok sku id — the external variant id. */
  skuId: string;
  /** The seller's own SKU (TikTok seller_sku), if set. */
  sellerSku: string | null;
  productName: string;
  /** Variation label built from the SKU's sales_attributes (null when none). */
  variantName: string | null;
  /** Total quantity TikTok currently reports for this SKU (Σ across warehouses). */
  quantity: number;
  /** Per-warehouse quantity (empty when not multi-warehouse). */
  warehouses: TikTokWarehouseStock[];
  status: string;
  raw: Record<string, unknown>;
};

/** A non-success TikTok envelope from a listings call, carrying the provider code + message. */
export class TikTokApiError extends Error {
  constructor(
    readonly code: number,
    readonly providerMessage?: string,
  ) {
    super(`TikTok Shop API error (code ${code}${providerMessage ? `: ${providerMessage}` : ''})`);
    this.name = 'TikTokApiError';
  }
}

// ── Loosely-typed API shapes (verify against the live 202309 docs when wiring sandbox) ──────
type TikTokInventory = { warehouse_id?: string; quantity?: number };
type TikTokSku = {
  id?: string;
  seller_sku?: string;
  sales_attributes?: { name?: string; value_name?: string }[];
  inventory?: TikTokInventory[];
};
type TikTokProductDetail = {
  id?: string;
  title?: string;
  status?: string;
  skus?: TikTokSku[];
};
type TikTokProductSearchData = {
  products?: { id?: string }[];
  next_page_token?: string;
  total_count?: number;
};

function extractWarehouses(sku: TikTokSku): TikTokWarehouseStock[] {
  return (sku.inventory ?? []).flatMap((entry) => {
    const code = entry.warehouse_id?.trim();
    return code ? [{ code, sellable: clampStock(entry.quantity) }] : [];
  });
}

function extractQuantity(sku: TikTokSku): number {
  return clampStock((sku.inventory ?? []).reduce((sum, entry) => sum + (entry.quantity ?? 0), 0));
}

function buildVariantName(sku: TikTokSku): string | null {
  const parts = (sku.sales_attributes ?? [])
    .map((attr) => attr.value_name?.trim())
    .filter((value): value is string => Boolean(value));
  return parts.length > 0 ? parts.join(' · ') : null;
}

function mapProductSkus(product: TikTokProductDetail): TikTokListingItem[] {
  const productId = String(product.id ?? '');
  if (!productId) return [];
  const productName = product.title ?? 'TikTok Shop product';
  const status = product.status ?? 'ACTIVE';

  return (product.skus ?? []).flatMap((sku) => {
    const skuId = String(sku.id ?? '');
    if (!skuId) return [];
    return [
      {
        productId,
        skuId,
        sellerSku: sku.seller_sku ?? null,
        productName,
        variantName: buildVariantName(sku),
        quantity: extractQuantity(sku),
        warehouses: extractWarehouses(sku),
        status,
        raw: { product_id: product.id, ...sku } as Record<string, unknown>,
      },
    ];
  });
}

/** Fetch full SKU detail (incl. inventory) for one product. */
async function fetchProductDetail(
  client: TikTokClient,
  params: { accessToken: string; shopCipher: string; productId: string },
): Promise<TikTokProductDetail> {
  const response = await client.call<TikTokProductDetail>(productDetailPath(params.productId), {
    method: 'GET',
    accessToken: params.accessToken,
    shopCipher: params.shopCipher,
  });
  if (!isTikTokSuccess(response)) throw new TikTokApiError(response.code, response.message);
  return response.data ?? {};
}

/** Flatten a set of product ids (detail per id) to per-SKU rows. */
async function expandProducts(
  client: TikTokClient,
  params: { accessToken: string; shopCipher: string; productIds: string[] },
): Promise<TikTokListingItem[]> {
  const rows: TikTokListingItem[] = [];
  for (const productId of params.productIds) {
    const detail = await fetchProductDetail(client, { ...params, productId });
    rows.push(...mapProductSkus({ ...detail, id: detail.id ?? productId }));
    await sleep(CALL_DELAY_MS);
  }
  return rows;
}

/**
 * Fetches a TikTok shop's live listings: page `products/search`, then `products/{id}` per product
 * for SKU-level inventory, flattened to one row per SKU. Shared by the web import adapter + the
 * worker drift job. Throws `TikTokApiError` on a non-success envelope.
 */
export async function fetchTikTokListings(
  client: TikTokClient,
  params: { accessToken: string; shopCipher: string },
): Promise<TikTokListingItem[]> {
  const productIds: string[] = [];
  let pageToken = '';

  for (let page = 0; page < MAX_PAGES; page += 1) {
    const response = await client.call<TikTokProductSearchData>(PRODUCT_SEARCH_PATH, {
      method: 'POST',
      accessToken: params.accessToken,
      shopCipher: params.shopCipher,
      query: pageToken ? { page_size: PAGE_SIZE, page_token: pageToken } : { page_size: PAGE_SIZE },
      body: {},
    });
    if (!isTikTokSuccess(response)) throw new TikTokApiError(response.code, response.message);

    for (const product of response.data?.products ?? []) {
      const id = String(product.id ?? '');
      if (id) productIds.push(id);
    }

    pageToken = response.data?.next_page_token ?? '';
    if (!pageToken) break;
    await sleep(CALL_DELAY_MS);
  }

  if (productIds.length === 0) return [];
  return expandProducts(client, { ...params, productIds });
}

/**
 * Fetches CURRENT stock for a specific set of products (drift reconciliation) — avoids paging the
 * whole catalog when only a handful are mapped. Mirrors {@link fetchTikTokListings}'s expansion.
 */
export async function fetchTikTokItemsStock(
  client: TikTokClient,
  params: { accessToken: string; shopCipher: string; productIds: string[] },
): Promise<TikTokListingItem[]> {
  const uniqueIds = [...new Set(params.productIds.filter(Boolean))];
  if (uniqueIds.length === 0) return [];
  return expandProducts(client, { ...params, productIds: uniqueIds });
}
