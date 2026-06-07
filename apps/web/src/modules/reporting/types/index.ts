import type { MarketplaceProvider } from '@prisma/client';

/** Where a realized sale happened: the offline counter or a marketplace channel. */
export type ProfitChannel = 'POS' | MarketplaceProvider;

export type ProfitPeriodGranularity = 'day' | 'week' | 'month';

/**
 * Money values are decimal strings ("12345.00"). Margin is computed ONLY over
 * lines whose cost is known (`costKnownRevenue` is its denominator); lines with
 * an unknown cost still count toward `grossRevenue`/`unitsSold` but are excluded
 * from COGS and margin so a missing cost never invents fake profit.
 */
export type ProfitMetrics = {
  grossRevenue: string;
  costKnownRevenue: string;
  cogs: string;
  grossProfit: string;
  grossMarginPct: number | null;
  unitsSold: number;
  costUnknownLines: number;
};

export type ProfitByChannel = ProfitMetrics & { channel: ProfitChannel };

export type ProfitByPeriod = ProfitMetrics & { period: string };

export type ProfitBySku = ProfitMetrics & {
  variantId: string | null;
  sku: string;
  name: string;
};

export type BelowCostItem = {
  variantId: string | null;
  sku: string;
  name: string;
  channel: ProfitChannel;
  unitPrice: string;
  unitCost: string;
  lossPerUnit: string;
  units: number;
};

/**
 * What processed returns netted back out of the summary above (positive
 * magnitudes). `summary`/`byChannel`/`byPeriod` are already NET of these; this
 * block surfaces the deduction so the netting isn't silent.
 */
export type ProfitReturnsSummary = {
  refundedRevenue: string;
  refundedCogs: string;
  units: number;
  lineCount: number;
};

export type ProfitReport = {
  range: { from: string; to: string; groupBy: ProfitPeriodGranularity };
  summary: ProfitMetrics;
  returns: ProfitReturnsSummary;
  byChannel: ProfitByChannel[];
  byPeriod: ProfitByPeriod[];
  topSku: ProfitBySku[];
  bottomSku: ProfitBySku[];
  belowCost: BelowCostItem[];
};

/**
 * Inventory valuation = on-hand stock valued at the variant's moving-average cost
 * (the same formula behind the dashboard's totalStockValue KPI). Money is an
 * integer-rupiah string. A variant with stock but no cost is counted in
 * `costUnknownVariants` and contributes 0 — never silently invents a value.
 */
export type InventoryValuationSummary = {
  totalStockValue: string;
  /** In-stock variants that have a known cost (contribute real value). */
  valuedVariants: number;
  /** In-stock variants missing a cost — their value is excluded from the total. */
  costUnknownVariants: number;
  totalVariants: number;
  availableUnits: number;
};

export type InventoryValuationProduct = {
  productId: string;
  productName: string;
  category: string | null;
  variantCount: number;
  costUnknownVariants: number;
  availableUnits: number;
  stockValue: string;
};

export type InventoryValuationReport = {
  summary: InventoryValuationSummary;
  byProduct: InventoryValuationProduct[];
};
