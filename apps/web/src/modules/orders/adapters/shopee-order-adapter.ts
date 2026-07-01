import 'server-only';

import { getServerEnv } from '@palka/config/env.server';
import {
  createShopeeClient,
  fetchShopeeOrders,
  ShopeeApiError,
} from '@palka/marketplace-providers';
import { acquireProviderToken } from '@palka/queue';
import type { ShopeeClient, ShopeeOrderRecord } from '@palka/marketplace-providers';
import type { MarketplaceProvider } from '@prisma/client';

import { OrderError } from '../errors/order-errors';
import type {
  FetchOrdersResult,
  MarketplaceOrderAdapter,
  NormalizedOrder,
  NormalizedOrderItem,
  NormalizedOrderStatus,
} from './order-adapter';

const DEFAULT_BASE_URL = 'https://partner.shopeemobile.com';

/** Re-pull overlap that absorbs clock skew + Shopee's eventual consistency (upserts dedupe). */
const OVERLAP_MS = 10 * 60 * 1000;
/** First-ever pull window when a store has never been pulled (the fetcher chunks it into ≤15-day
 *  sub-windows, Shopee's per-call cap). */
const BACKFILL_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Shopee `order_status` → our normalized order status. Shopee reports ONE status per order (no
 * per-line status, unlike Lazada). Conservative for stock: `READY_TO_SHIP`/`PROCESSED` are
 * paid-and-awaiting-handover, so they RESERVE (PAID) — the reservation isn't consumed until
 * `SHIPPED`. `IN_CANCEL` (cancellation requested, not finalized) keeps the reservation until the
 * order actually becomes `CANCELLED`. `INVOICE_PENDING` is post-payment (awaiting tax invoice) →
 * reserve. `TO_RETURN` stays SHIPPED — the actual restock runs through the Returns module, never
 * auto-credited here. Unknown tokens map to null and are ignored (treated as PENDING).
 */
const SHOPEE_ORDER_STATUS_MAP: Record<string, NormalizedOrderStatus> = {
  UNPAID: 'PENDING',
  READY_TO_SHIP: 'PAID',
  PROCESSED: 'PAID',
  RETRY_SHIP: 'PAID',
  INVOICE_PENDING: 'PAID',
  IN_CANCEL: 'PAID',
  SHIPPED: 'SHIPPED',
  TO_CONFIRM_RECEIVE: 'SHIPPED',
  TO_RETURN: 'SHIPPED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
};

/** Normalize one Shopee order_status token; null when unrecognized. */
export function normalizeShopeeStatus(token: string): NormalizedOrderStatus | null {
  return SHOPEE_ORDER_STATUS_MAP[token.trim().toUpperCase()] ?? null;
}

/** Shopee timestamps are UNIX SECONDS; null when absent/unparseable. */
function fromUnixSeconds(value: number | null): Date | null {
  if (value === null || !Number.isFinite(value) || value <= 0) return null;
  return new Date(value * 1000);
}

export function toNormalizedShopeeOrder(record: ShopeeOrderRecord): NormalizedOrder {
  const items: NormalizedOrderItem[] = record.lines.map((line) => ({
    externalProductId: line.itemId,
    // Shopee model_id is the external variant id the listing import stored ("0" for a no-variation
    // item); it resolves the mapped internal variant.
    externalVariantId: line.modelId,
    externalSku: line.modelSku ?? line.itemSku,
    externalName: line.name,
    quantity: line.quantity,
    unitPrice: line.unitPrice,
  }));

  return {
    externalOrderId: record.orderSn,
    status: normalizeShopeeStatus(record.status) ?? 'PENDING',
    trackingNumber: record.trackingNumber,
    buyerName: record.buyerName,
    totalAmount: record.totalAmount,
    currency: record.currency,
    placedAt:
      fromUnixSeconds(record.createTime) ?? fromUnixSeconds(record.updateTime) ?? new Date(),
    updatedAt: fromUnixSeconds(record.updateTime),
    items,
    raw: record.raw,
  };
}

function wrapShopeeError(error: unknown): never {
  if (error instanceof ShopeeApiError) {
    throw OrderError.validation(
      `Shopee order pull failed (${error.code}${
        error.providerMessage ? `: ${error.providerMessage}` : ''
      }).`,
    );
  }
  throw error;
}

/**
 * Pulls a Shopee shop's recent orders via the shared Open Platform v2 order fetchers and normalizes
 * each to a cross-provider {@link NormalizedOrder}. Real provider adapter — replaces the stub for
 * SHOPEE once SHOPEE_PARTNER_ID/KEY are configured. The incremental window comes from `since` (the
 * connection's last pull); idempotent upserts in the ingest service make the overlap safe. Shopee
 * ignores `shopCipher` (that is the TikTok/Tokopedia shop cipher).
 */
export class ShopeeOrderAdapter implements MarketplaceOrderAdapter {
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

  async fetchOrders(params: {
    shopId: string;
    shopCipher: string | null;
    accessToken: string;
    since?: Date;
    full?: boolean;
  }): Promise<FetchOrdersResult> {
    const now = Date.now();
    const windowStartMs =
      params.since && !params.full ? params.since.getTime() - OVERLAP_MS : now - BACKFILL_MS;

    try {
      const result = await fetchShopeeOrders(this.client, {
        accessToken: params.accessToken,
        shopId: params.shopId,
        timeFrom: Math.floor(windowStartMs / 1000),
        timeTo: Math.floor(now / 1000),
        timeRangeField: 'update_time',
        onThrottle: 'partial',
        // Pace EVERY internal call (each list page + each detail batch + each tracking lookup)
        // through the shared per-shop/per-app Redis budget — coordinated across import + sync +
        // drift, multi-worker safe. A backfill makes many calls; one token up front would trip the
        // per-shop QPS.
        beforeCall: () => acquireProviderToken('SHOPEE', params.shopId),
      });
      return { orders: result.records.map(toNormalizedShopeeOrder), complete: result.complete };
    } catch (error) {
      wrapShopeeError(error);
    }
  }
}
