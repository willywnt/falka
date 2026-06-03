import type { MarketplaceProvider } from '@prisma/client';

export type NormalizedOrderStatus = 'PENDING' | 'PAID' | 'SHIPPED' | 'COMPLETED' | 'CANCELLED';

export type NormalizedOrderItem = {
  externalProductId: string;
  externalVariantId: string;
  externalSku: string | null;
  externalName: string;
  quantity: number;
  unitPrice: number | null;
};

export type NormalizedOrder = {
  externalOrderId: string;
  status: NormalizedOrderStatus;
  noResi: string | null;
  buyerName: string | null;
  totalAmount: number | null;
  currency: string | null;
  placedAt: Date;
  items: NormalizedOrderItem[];
  raw: Record<string, unknown>;
};

export interface MarketplaceOrderAdapter {
  readonly provider: MarketplaceProvider;
  fetchOrders(params: { shopId: string; accessToken: string }): Promise<NormalizedOrder[]>;
}

function stubItem(
  shopId: string,
  index: number,
  sku: string,
  name: string,
  quantity: number,
): NormalizedOrderItem {
  return {
    // Mirrors StubMarketplaceImportAdapter's external ids so orders resolve via mappings.
    externalProductId: `${shopId}-P${index}`,
    externalVariantId: `${shopId}-V${index}`,
    externalSku: sku,
    externalName: name,
    quantity,
    unitPrice: 100_000,
  };
}

/**
 * Deterministic stand-in for a real order API. Returns a stable set of orders
 * for a shop (idempotent re-pull) that reference the stub listings, so a paid
 * order decrements the mapped internal variant. Real provider adapters replace
 * this without touching the ingest service.
 */
export class StubMarketplaceOrderAdapter implements MarketplaceOrderAdapter {
  constructor(readonly provider: MarketplaceProvider) {}

  fetchOrders(params: { shopId: string }): Promise<NormalizedOrder[]> {
    const s = params.shopId;
    const raw = { source: 'stub' };

    return Promise.resolve([
      {
        externalOrderId: `${s}-ORD-1`,
        status: 'PAID',
        noResi: `RESI-${s}-1`,
        buyerName: 'Budi',
        totalAmount: 200_000,
        currency: 'IDR',
        placedAt: new Date(Date.UTC(2026, 0, 10)),
        items: [stubItem(s, 2, 'BLACK-M', 'Cotton Tee - Black / M', 2)],
        raw,
      },
      {
        externalOrderId: `${s}-ORD-2`,
        status: 'PAID',
        noResi: `RESI-${s}-2`,
        buyerName: 'Sari',
        totalAmount: 100_000,
        currency: 'IDR',
        placedAt: new Date(Date.UTC(2026, 0, 11)),
        items: [stubItem(s, 1, 'BLACK-S', 'Cotton Tee - Black / S', 1)],
        raw,
      },
      {
        externalOrderId: `${s}-ORD-3`,
        status: 'PENDING',
        noResi: null,
        buyerName: 'Andi',
        totalAmount: 150_000,
        currency: 'IDR',
        placedAt: new Date(Date.UTC(2026, 0, 12)),
        items: [stubItem(s, 5, '300ML', 'Enamel Mug - 300ml', 3)],
        raw,
      },
    ]);
  }
}

const adapters = new Map<MarketplaceProvider, MarketplaceOrderAdapter>();

export function getMarketplaceOrderAdapter(provider: MarketplaceProvider): MarketplaceOrderAdapter {
  const existing = adapters.get(provider);
  if (existing) return existing;

  const adapter = new StubMarketplaceOrderAdapter(provider);
  adapters.set(provider, adapter);
  return adapter;
}
