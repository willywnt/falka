import type { PurchaseOrderStatus } from '@prisma/client';

export type { PurchaseOrderStatus };

/** A variant offered in the PO picker (cost + current available/incoming stock). */
export type PurchasableVariant = {
  variantId: string;
  sku: string;
  name: string;
  productName: string;
  cost: string | null;
  availableStock: number;
  incomingStock: number;
  /** Variant photo public URL; null = none. */
  imageUrl: string | null;
};

export type PurchaseOrderItemDetail = {
  id: string;
  productVariantId: string;
  sku: string;
  name: string;
  quantity: number;
  receivedQuantity: number;
  outstanding: number;
  unitCost: string;
  lineTotal: string;
};

export type PurchaseOrderListItem = {
  id: string;
  code: string;
  supplierName: string | null;
  status: PurchaseOrderStatus;
  totalCost: string;
  itemCount: number;
  orderedAt: string;
};

export type PurchaseOrderDetail = PurchaseOrderListItem & {
  note: string | null;
  receivedAt: string | null;
  items: PurchaseOrderItemDetail[];
};
