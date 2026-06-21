import type { PurchaseOrderStatus } from '@prisma/client';

import type { BundleResolution } from '@/modules/catalog/types';

export type { PurchaseOrderStatus };

/** A variant offered in the PO picker (cost + current available/incoming stock). */
export type PurchasableVariant = {
  variantId: string;
  sku: string;
  name: string;
  productName: string;
  /** Parent group label when this is a subvariant; null = standalone. */
  variantGroup: string | null;
  cost: string | null;
  availableStock: number;
  incomingStock: number;
  /** Variant photo public URL; null = none. */
  imageUrl: string | null;
};

/** What a scanned PO code resolves to — a standalone variant or a whole bundle. */
export type ScannedPurchaseItem =
  | { kind: 'variant'; variant: PurchasableVariant }
  | { kind: 'bundle'; bundle: BundleResolution };

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
  /** Snapshot of the bundle this line came from (null = a standalone variant line). */
  bundleName: string | null;
  /** Live variant context (for rehydrating a draft into the edit form + richer detail). */
  productName: string;
  variantGroup: string | null;
  availableStock: number;
  incomingStock: number;
  imageUrl: string | null;
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
  /** Linked supplier id (null = free-text/none) — lets the edit form keep the link. */
  supplierId: string | null;
  note: string | null;
  receivedAt: string | null;
  items: PurchaseOrderItemDetail[];
};

/** A supplier/vendor row (reorder fallbacks + usage counts). */
export type SupplierListItem = {
  id: string;
  name: string;
  phone: string | null;
  note: string | null;
  defaultLeadTimeDays: number | null;
  defaultMinOrderQty: number | null;
  isActive: boolean;
  /** POs that reference this supplier (history; survives soft-delete). */
  purchaseOrderCount: number;
  /** Variants that name this their preferred supplier. */
  variantCount: number;
  createdAt: string;
};

export type SupplierDetail = SupplierListItem;

/** Lightweight option for pickers (PO form, variant edit). */
export type SupplierOption = {
  id: string;
  name: string;
  defaultLeadTimeDays: number | null;
  defaultMinOrderQty: number | null;
};
