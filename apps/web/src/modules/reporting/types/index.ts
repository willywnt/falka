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
 * Channel performance = the profit metrics per sales channel, plus the dimensions
 * the flat profit report omits: each channel's share of net revenue, its
 * transaction count + average order value, and what returns clawed back. All money
 * is net of processed returns (same recognition as the profit report).
 */
export type ChannelPerformanceRow = ProfitMetrics & {
  channel: ProfitChannel;
  /** Net gross revenue as a % of all channels' net revenue (null when total is 0). */
  revenueSharePct: number | null;
  /** Distinct completed POS sales / shipped-or-completed marketplace orders in range. */
  transactions: number;
  /** grossRevenue / transactions (money string); "0.00" when there are no transactions. */
  avgOrderValue: string;
  /** Refunded revenue netted out for this channel (positive magnitude). */
  refundedRevenue: string;
  /** refundedRevenue as a % of this channel's gross revenue (null when revenue is 0). */
  returnRatePct: number | null;
};

/** One row of the channel × period trend matrix: net revenue per channel for a period. */
export type ChannelTrendPeriod = {
  period: string;
  /** Net gross revenue per channel key (a money string), keyed by channel. */
  revenueByChannel: Record<string, string>;
  total: string;
};

export type ChannelPerformanceReport = {
  range: { from: string; to: string; groupBy: ProfitPeriodGranularity };
  summary: {
    totalGrossRevenue: string;
    totalGrossProfit: string;
    grossMarginPct: number | null;
    transactions: number;
    activeChannels: number;
    /** The channel with the highest net revenue (null when there are no sales). */
    topByRevenue: ProfitChannel | null;
    /** The channel with the highest gross margin % among those with a known cost. */
    topByMargin: ProfitChannel | null;
  };
  /** Per-channel rows, highest net revenue first (also the trend matrix's column order). */
  byChannel: ChannelPerformanceRow[];
  /** Per-period rows, oldest first (the trend matrix's rows). */
  trend: ChannelTrendPeriod[];
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

/**
 * Dead-stock scan = a snapshot of variants still holding stock that haven't sold
 * for at least `staleDays` days. "Last sold" is the most recent SALE (POS) or
 * ORDER_RESERVE (a paid marketplace order) — the genuine outbound-demand signals.
 * A never-sold variant only counts once it's older than the threshold, so a fresh
 * SKU isn't called dead. Capital is valued at the moving-average cost; a missing
 * cost is flagged and contributes 0 (`stockValue` is an integer-rupiah string).
 */
export type DeadStockStatus = 'DEAD' | 'NEVER_SOLD';

export type DeadStockRow = {
  variantId: string;
  productId: string;
  productName: string;
  variantName: string;
  variantGroup: string | null;
  sku: string;
  available: number;
  /** Moving-average cost as a money string, or null when not recorded. */
  cost: string | null;
  /** available × cost rounded to whole rupiah; "0" when the cost is unknown. */
  stockValue: string;
  /** Days since the last sale, or null when the variant has never sold. */
  daysSinceLastSale: number | null;
  /** How long the position has sat idle: `daysSinceLastSale`, or the variant age when never sold. */
  idleDays: number;
  status: DeadStockStatus;
};

export type DeadStockSummary = {
  /** The "no sales in N days" threshold this report was run with. */
  staleDays: number;
  deadSkuCount: number;
  /** Capital stuck in dead stock (sum of `stockValue`, integer-rupiah string). */
  stuckValue: string;
  neverSoldCount: number;
  /** Dead variants missing a cost — their value is excluded from `stuckValue`. */
  costUnknownCount: number;
  /** Total available units sitting idle across the dead rows. */
  idleUnits: number;
};

export type DeadStockReport = {
  summary: DeadStockSummary;
  rows: DeadStockRow[];
};

/**
 * ABC analysis = a Pareto ranking of SKUs by their contribution to net revenue
 * over the range (same realized-sales basis as the profit report, so returns net
 * out). Class A holds the top ~80% of revenue, B the next ~15%, C the long tail;
 * the cumulative share is taken over positive revenue only, so a return-heavy SKU
 * (net ≤ 0) lands in C rather than distorting the running total. Money values are
 * decimal strings.
 */
export type AbcClass = 'A' | 'B' | 'C';

export type AbcRow = {
  variantId: string | null;
  sku: string;
  name: string;
  revenue: string;
  unitsSold: number;
  /** This SKU's share of total positive revenue (%, null when there is no revenue). */
  revenueSharePct: number | null;
  /** Running cumulative share at this row (%, 0–100; null when there is no revenue). */
  cumulativeSharePct: number | null;
  class: AbcClass;
};

export type AbcClassSummary = {
  class: AbcClass;
  skuCount: number;
  revenue: string;
  revenueSharePct: number | null;
  unitsSold: number;
};

export type AbcReport = {
  range: { from: string; to: string };
  totalRevenue: string;
  /** Always three rows, in A → B → C order. */
  classes: AbcClassSummary[];
  /** Every SKU, highest net revenue first. */
  rows: AbcRow[];
};
