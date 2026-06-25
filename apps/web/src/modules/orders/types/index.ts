import type { MarketplaceProvider, OrderStatus } from '@prisma/client';

export type OrderItemDetail = {
  id: string;
  externalName: string;
  externalSku: string | null;
  quantity: number;
  unitPrice: string | null;
  resolved: boolean;
  variant: {
    id: string;
    sku: string;
    name: string;
    productName: string;
    imageUrl: string | null;
  } | null;
};

export type OrderListItem = {
  id: string;
  externalOrderId: string;
  provider: MarketplaceProvider;
  shopName: string;
  status: OrderStatus;
  buyerName: string | null;
  noResi: string | null;
  totalAmount: string | null;
  currency: string | null;
  itemCount: number;
  unresolvedCount: number;
  /** Stock was reserved for this order (available−, reserved+) — `inventoryAppliedAt` set. */
  inventoryApplied: boolean;
  /** The reservation was consumed at ship time (reserved−) — `inventoryShippedAt` set. */
  inventoryShipped: boolean;
  /** The reservation was released back to available on a pre-ship cancel — `inventoryRevertedAt` set. */
  inventoryReverted: boolean;
  /** When a packing video for this order's resi completed (ISO), if ever. */
  fulfilledAt: string | null;
  placedAt: string;
  /** The order's last-change time on the marketplace (ISO); drives the recency sort. Null = unknown. */
  updatedAt: string | null;
  /** When this order's store was last pulled (ISO), if ever. */
  lastPulledAt: string | null;
};

/** Marketplace-specific order metadata pulled best-effort from the raw payload (see utils). */
export type OrderMarketplaceMeta = {
  /** Human-facing order number (distinct from externalOrderId). */
  orderNumber: string | null;
  paymentMethod: string | null;
  shippingFee: number | null;
  /** Ship-by SLA the channel promised the buyer. */
  promisedShipTime: string | null;
  /** Logistics provider / courier for the shipment. */
  courier: string | null;
  warehouseCode: string | null;
  returnStatus: string | null;
  /** A buyer/system cancellation is awaiting the seller's action — don't ship. */
  cancelPending: boolean;
};

export type OrderDetail = OrderListItem & {
  items: OrderItemDetail[];
  /** Free-text reason captured when the order was cancelled manually (null otherwise). */
  cancelReason: string | null;
  /** Channel-specific metadata (SLA, courier, payment, …) surfaced per status. */
  marketplace: OrderMarketplaceMeta;
};

/** Result of pulling from several stores at once. */
export type MultiPullOrdersResult = {
  storesPulled: number;
  storesSkipped: string[];
  pulled: number;
  /** Paid orders whose stock was reserved (available−, reserved+). */
  applied: number;
  /** Shipped/completed orders whose reservation was consumed (reserved−). */
  shipped: number;
  /** Cancelled orders whose reservation was released back to available. */
  reverted: number;
};
