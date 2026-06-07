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
