import type { SalePaymentMethod, SaleStatus } from '@prisma/client';

import type { BundleResolution } from '@/modules/catalog/types';

export type { SalePaymentMethod, SaleStatus };

/** A variant offered in the POS picker (catalog price + current sellable stock). */
export type SellableVariant = {
  variantId: string;
  sku: string;
  name: string;
  productName: string;
  /** Parent group label when this is a subvariant; null = standalone. */
  variantGroup: string | null;
  price: string;
  /** Unit cost (modal) snapshot for the below-cost warning; null = not set. */
  cost: string | null;
  availableStock: number;
  /** Units on order from suppliers (not yet received). */
  incomingStock: number;
  /** Variant photo public URL; null = none. */
  imageUrl: string | null;
};

/** What a scanned POS code resolves to — a standalone variant or a whole bundle. */
export type ScannedSaleItem =
  | { kind: 'variant'; variant: SellableVariant }
  | { kind: 'bundle'; bundle: BundleResolution };

export type SaleItemDetail = {
  id: string;
  productVariantId: string;
  sku: string;
  name: string;
  quantity: number;
  unitPrice: string;
  /** This line's allocated share of the cart discount. */
  discountAmount: string;
  lineTotal: string;
  /** Units already refunded across all refunds (refundable = quantity − this). */
  refundedQuantity: number;
  /** Snapshot of the bundle this line came from (null = a standalone variant line). */
  bundleName: string | null;
  /** Variant photo public URL; null = none. */
  imageUrl: string | null;
};

/** One refund event against a sale (summary for the detail aside). */
export type SaleRefundSummary = {
  id: string;
  code: string;
  totalAmount: string;
  note: string | null;
  createdAt: string;
  /** Total units returned in this refund. */
  itemCount: number;
};

export type SaleListItem = {
  id: string;
  code: string;
  customerName: string | null;
  paymentMethod: SalePaymentMethod;
  status: SaleStatus;
  totalAmount: string;
  itemCount: number;
  createdAt: string;
};

export type SaleDetail = SaleListItem & {
  note: string | null;
  /** Gross sum of lines before discount/tax. */
  subtotalAmount: string;
  /** Cart-level discount in rupiah (0 = none). */
  discountAmount: string;
  /** PPN rate in percent (0 = no tax). */
  taxRate: number;
  /** Resolved PPN in rupiah (contained in totalAmount when taxInclusive). */
  taxAmount: string;
  taxInclusive: boolean;
  items: SaleItemDetail[];
  refunds: SaleRefundSummary[];
  /** Total cash returned across all refunds. */
  refundedAmount: string;
};
