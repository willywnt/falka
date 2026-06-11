import type { AbcClass, AbcClassSummary, AbcReport, AbcRow } from '../types';
import { money, round2, type SoldLine } from './metrics';

export type { SoldLine } from './metrics';

/** Cumulative net-revenue cutoffs (%) for the A and B classes; the rest is C. */
export const ABC_THRESHOLDS = { a: 80, b: 95 } as const;

type SkuAcc = {
  variantId: string | null;
  sku: string;
  name: string;
  revenue: number;
  units: number;
};

/**
 * Rank SKUs by their share of net revenue and bucket them A/B/C (Pareto). Lines
 * are the same realized-sale lines the profit report uses, so return reversals
 * (negative qty) net each SKU down. The cumulative share is measured over the
 * positive-revenue total only — a SKU whose returns outweigh its sales (net ≤ 0)
 * drops straight to C and can never push the running cumulative past 100%. Pure.
 */
export function aggregateAbc(lines: SoldLine[], opts: { from: Date; to: Date }): AbcReport {
  const bySku = new Map<string, SkuAcc>();

  for (const line of lines) {
    const key = line.variantId ?? `sku:${line.sku}`;
    const entry = bySku.get(key) ?? {
      variantId: line.variantId,
      sku: line.sku,
      name: line.name,
      revenue: 0,
      units: 0,
    };
    entry.revenue += line.unitPrice * line.quantity;
    entry.units += line.quantity;
    bySku.set(key, entry);
  }

  const sorted = [...bySku.values()].sort((a, b) => b.revenue - a.revenue);
  const totalRevenue = sorted.reduce((sum, entry) => sum + entry.revenue, 0);
  const totalPositive = sorted.reduce((sum, entry) => sum + Math.max(0, entry.revenue), 0);

  const classAcc: Record<AbcClass, { skuCount: number; revenue: number; units: number }> = {
    A: { skuCount: 0, revenue: 0, units: 0 },
    B: { skuCount: 0, revenue: 0, units: 0 },
    C: { skuCount: 0, revenue: 0, units: 0 },
  };

  let cumulative = 0;
  const rows: AbcRow[] = sorted.map((entry) => {
    let cls: AbcClass;
    if (totalPositive <= 0 || entry.revenue <= 0) {
      cls = 'C';
    } else {
      cumulative += entry.revenue;
      const cumPct = (cumulative / totalPositive) * 100;
      cls = cumPct <= ABC_THRESHOLDS.a ? 'A' : cumPct <= ABC_THRESHOLDS.b ? 'B' : 'C';
    }

    classAcc[cls].skuCount += 1;
    classAcc[cls].revenue += entry.revenue;
    classAcc[cls].units += entry.units;

    return {
      variantId: entry.variantId,
      sku: entry.sku,
      name: entry.name,
      revenue: money(entry.revenue),
      unitsSold: entry.units,
      revenueSharePct: totalPositive > 0 ? round2((entry.revenue / totalPositive) * 100) : null,
      cumulativeSharePct: totalPositive > 0 ? round2((cumulative / totalPositive) * 100) : null,
      class: cls,
    };
  });

  const classes: AbcClassSummary[] = (['A', 'B', 'C'] as const).map((cls) => ({
    class: cls,
    skuCount: classAcc[cls].skuCount,
    revenue: money(classAcc[cls].revenue),
    revenueSharePct:
      totalPositive > 0 ? round2((classAcc[cls].revenue / totalPositive) * 100) : null,
    unitsSold: classAcc[cls].units,
  }));

  return {
    range: { from: opts.from.toISOString(), to: opts.to.toISOString() },
    totalRevenue: money(totalRevenue),
    classes,
    rows,
  };
}
