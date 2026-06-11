import type { DeadStockReport, DeadStockRow, DeadStockStatus, DeadStockSummary } from '../types';
import { money } from './metrics';

/** One variant's idle position, normalized for the dead-stock scan. */
export type DeadStockVariant = {
  variantId: string;
  productId: string;
  productName: string;
  variantName: string;
  variantGroup: string | null;
  sku: string;
  available: number;
  /** Moving-average cost; null = no cost recorded yet (value excluded). */
  cost: number | null;
  /** Days since the last sale (SALE/ORDER_RESERVE), or null when never sold. */
  daysSinceLastSale: number | null;
  /** Days since the variant was created (so a brand-new never-sold SKU isn't dead). */
  ageDays: number;
};

/** Stock value of a single variant, rounded to whole rupiah (cost-unknown = 0). */
function variantValue(variant: DeadStockVariant): number {
  return variant.cost == null ? 0 : Math.round(variant.cost * variant.available);
}

/**
 * Find slow/dead inventory: variants still holding stock (`available > 0`) that
 * have sat idle for at least `staleDays` days. A variant's idle age is the days
 * since its last sale, or — when it has never sold — its own age, so a fresh SKU
 * is never flagged. Rows are sorted by stuck capital (highest first) so the most
 * expensive dead weight surfaces at the top. Pure — the service feeds it the
 * variant rows plus each one's days-since-last-sale.
 */
export function aggregateDeadStock(
  variants: DeadStockVariant[],
  opts: { staleDays: number },
): DeadStockReport {
  const { staleDays } = opts;
  const rows: DeadStockRow[] = [];

  let stuckValue = 0;
  let neverSoldCount = 0;
  let costUnknownCount = 0;
  let idleUnits = 0;

  for (const variant of variants) {
    if (variant.available <= 0) continue;
    const idleDays = variant.daysSinceLastSale ?? variant.ageDays;
    if (idleDays < staleDays) continue;

    const status: DeadStockStatus = variant.daysSinceLastSale == null ? 'NEVER_SOLD' : 'DEAD';
    const value = variantValue(variant);

    stuckValue += value;
    idleUnits += variant.available;
    if (status === 'NEVER_SOLD') neverSoldCount += 1;
    if (variant.cost == null) costUnknownCount += 1;

    rows.push({
      variantId: variant.variantId,
      productId: variant.productId,
      productName: variant.productName,
      variantName: variant.variantName,
      variantGroup: variant.variantGroup,
      sku: variant.sku,
      available: variant.available,
      cost: variant.cost == null ? null : money(variant.cost),
      stockValue: String(value),
      daysSinceLastSale: variant.daysSinceLastSale,
      idleDays,
      status,
    });
  }

  rows.sort((a, b) => {
    const valueDiff = Number(b.stockValue) - Number(a.stockValue);
    if (valueDiff !== 0) return valueDiff;
    return b.idleDays - a.idleDays;
  });

  const summary: DeadStockSummary = {
    staleDays,
    deadSkuCount: rows.length,
    stuckValue: String(stuckValue),
    neverSoldCount,
    costUnknownCount,
    idleUnits,
  };

  return { summary, rows };
}
