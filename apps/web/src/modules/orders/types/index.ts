import type { MarketplaceProvider, OrderStatus } from '@prisma/client';

export type OrderItemDetail = {
  id: string;
  externalName: string;
  externalSku: string | null;
  quantity: number;
  unitPrice: string | null;
  resolved: boolean;
  variant: { id: string; sku: string; name: string; productName: string } | null;
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
  inventoryApplied: boolean;
  placedAt: string;
};

export type OrderDetail = OrderListItem & { items: OrderItemDetail[] };

export type PullOrdersResult = { pulled: number; applied: number };
