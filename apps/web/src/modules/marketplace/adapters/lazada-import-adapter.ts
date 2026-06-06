import 'server-only';

import { getServerEnv } from '@olshop/config/env.server';
import { createLazadaClient, isLazadaSuccess } from '@olshop/marketplace-providers';
import type { LazadaClient } from '@olshop/marketplace-providers';
import type { MarketplaceProvider } from '@prisma/client';

import { MarketplaceError } from '../errors/marketplace-errors';
import type { MarketplaceImportAdapter, NormalizedListing } from './import-adapter';

const PRODUCTS_GET_PATH = '/products/get';
const DEFAULT_BASE_URL = 'https://api.lazada.co.id/rest';
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

function mapProducts(products: LazadaApiProduct[]): NormalizedListing[] {
  const listings: NormalizedListing[] = [];

  for (const product of products) {
    const externalProductId = String(product.item_id ?? '');
    const productName = product.attributes?.name ?? 'Lazada product';

    for (const sku of product.skus ?? []) {
      const externalVariantId = String(sku.SkuId ?? '');
      if (!externalProductId || !externalVariantId) continue;

      listings.push({
        externalProductId,
        externalVariantId,
        externalSku: sku.SellerSku ?? null,
        externalProductName: productName,
        externalVariantName: null,
        stock: typeof sku.quantity === 'number' ? sku.quantity : 0,
        status: sku.Status ?? product.status ?? 'active',
        raw: { item_id: product.item_id, ...sku } as Record<string, unknown>,
      });
    }
  }

  return listings;
}

/**
 * Imports a Lazada shop's live listings via the LazOP /products/get API, paging
 * until exhausted. Real provider adapter — replaces the stub for LAZADA once the
 * app credentials are configured. The response shape (item_id / attributes.name /
 * skus[].SkuId/SellerSku/quantity) should be re-verified against the sandbox.
 */
export class LazadaImportAdapter implements MarketplaceImportAdapter {
  readonly provider: MarketplaceProvider = 'LAZADA';
  private readonly client: LazadaClient;

  constructor() {
    const env = getServerEnv();
    this.client = createLazadaClient({
      appKey: env.LAZADA_APP_KEY ?? '',
      appSecret: env.LAZADA_APP_SECRET ?? '',
      baseUrl: env.LAZADA_API_BASE_URL ?? DEFAULT_BASE_URL,
    });
  }

  async fetchListings(params: {
    shopId: string;
    accessToken: string;
  }): Promise<NormalizedListing[]> {
    const listings: NormalizedListing[] = [];

    for (let page = 0; page < MAX_PAGES; page += 1) {
      const response = await this.client.call<LazadaProductsGetData>(PRODUCTS_GET_PATH, {
        method: 'GET',
        accessToken: params.accessToken,
        params: { filter: 'all', limit: PAGE_LIMIT, offset: page * PAGE_LIMIT },
      });

      if (!isLazadaSuccess(response)) {
        throw MarketplaceError.validation(
          `Lazada import failed (code ${response.code}${
            response.message ? `: ${response.message}` : ''
          }).`,
        );
      }

      const products = response.data?.products ?? [];
      if (products.length === 0) break;

      listings.push(...mapProducts(products));
      if (products.length < PAGE_LIMIT) break;
    }

    return listings;
  }
}
