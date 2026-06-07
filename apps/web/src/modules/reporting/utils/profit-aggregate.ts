import type {
  BelowCostItem,
  ProfitBySku,
  ProfitChannel,
  ProfitMetrics,
  ProfitPeriodGranularity,
  ProfitReport,
  ProfitReturnsSummary,
} from '../types';

/** A single realized sale line, normalized across POS and marketplace orders. */
export type SoldLine = {
  date: Date;
  channel: ProfitChannel;
  variantId: string | null;
  sku: string;
  name: string;
  quantity: number;
  unitPrice: number;
  unitCost: number | null;
};

const TOP_SKU_LIMIT = 10;
const BELOW_COST_LIMIT = 50;

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function money(value: number): string {
  return round2(value).toFixed(2);
}

type Acc = {
  grossRevenue: number;
  costKnownRevenue: number;
  cogs: number;
  units: number;
  costUnknownLines: number;
};

function newAcc(): Acc {
  return { grossRevenue: 0, costKnownRevenue: 0, cogs: 0, units: 0, costUnknownLines: 0 };
}

function addLine(acc: Acc, line: SoldLine): void {
  const revenue = line.unitPrice * line.quantity;
  acc.grossRevenue += revenue;
  acc.units += line.quantity;

  if (line.unitCost == null) {
    acc.costUnknownLines += 1;
    return;
  }
  acc.costKnownRevenue += revenue;
  acc.cogs += line.unitCost * line.quantity;
}

function toMetrics(acc: Acc): ProfitMetrics {
  const grossProfit = acc.costKnownRevenue - acc.cogs;
  return {
    grossRevenue: money(acc.grossRevenue),
    costKnownRevenue: money(acc.costKnownRevenue),
    cogs: money(acc.cogs),
    grossProfit: money(grossProfit),
    grossMarginPct:
      acc.costKnownRevenue > 0 ? round2((grossProfit / acc.costKnownRevenue) * 100) : null,
    unitsSold: acc.units,
    costUnknownLines: acc.costUnknownLines,
  };
}

/** ISO-8601 week key, e.g. "2026-W23". */
function isoWeekKey(date: Date): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNum = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - dayNum + 3);
  const firstThursday = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  const week = 1 + Math.round((d.getTime() - firstThursday.getTime()) / (7 * 24 * 60 * 60 * 1000));
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

function periodKey(date: Date, groupBy: ProfitPeriodGranularity): string {
  if (groupBy === 'month') return date.toISOString().slice(0, 7);
  if (groupBy === 'week') return isoWeekKey(date);
  return date.toISOString().slice(0, 10);
}

/**
 * Summarize the return reversals (the negative-qty lines) into positive
 * refund magnitudes, so the UI can show what was netted out.
 */
function summarizeReturns(lines: SoldLine[]): ProfitReturnsSummary {
  let refundedRevenue = 0;
  let refundedCogs = 0;
  let units = 0;
  let lineCount = 0;

  for (const line of lines) {
    if (line.quantity >= 0) continue;
    const returnedUnits = -line.quantity;
    refundedRevenue += line.unitPrice * returnedUnits;
    units += returnedUnits;
    lineCount += 1;
    if (line.unitCost != null) refundedCogs += line.unitCost * returnedUnits;
  }

  return {
    refundedRevenue: money(refundedRevenue),
    refundedCogs: money(refundedCogs),
    units,
    lineCount,
  };
}

/** Full per-SKU profit list, highest gross profit first (drives top/bottom + CSV). */
export function aggregateProfitBySku(lines: SoldLine[]): ProfitBySku[] {
  const bySku = new Map<
    string,
    { sku: string; name: string; variantId: string | null; acc: Acc }
  >();

  for (const line of lines) {
    const key = line.variantId ?? `sku:${line.sku}`;
    const entry = bySku.get(key) ?? {
      sku: line.sku,
      name: line.name,
      variantId: line.variantId,
      acc: newAcc(),
    };
    addLine(entry.acc, line);
    bySku.set(key, entry);
  }

  return [...bySku.values()]
    .map((entry) => ({
      ...toMetrics(entry.acc),
      variantId: entry.variantId,
      sku: entry.sku,
      name: entry.name,
    }))
    .sort((a, b) => Number(b.grossProfit) - Number(a.grossProfit));
}

export function aggregateProfit(
  lines: SoldLine[],
  opts: { from: Date; to: Date; groupBy: ProfitPeriodGranularity },
): ProfitReport {
  const summary = newAcc();
  const byChannel = new Map<ProfitChannel, Acc>();
  const byPeriod = new Map<string, Acc>();
  const belowCost = new Map<string, BelowCostItem>();

  for (const line of lines) {
    addLine(summary, line);

    const channelAcc = byChannel.get(line.channel) ?? newAcc();
    addLine(channelAcc, line);
    byChannel.set(line.channel, channelAcc);

    const pk = periodKey(line.date, opts.groupBy);
    const periodAcc = byPeriod.get(pk) ?? newAcc();
    addLine(periodAcc, line);
    byPeriod.set(pk, periodAcc);

    // Below-cost is a SALES signal — only positive (real sale) lines qualify, so a
    // return reversal never lands in (or distorts) the watchlist.
    if (line.quantity > 0 && line.unitCost != null && line.unitPrice < line.unitCost) {
      const key = `${line.variantId ?? line.sku}|${line.channel}|${line.unitPrice}|${line.unitCost}`;
      const existing = belowCost.get(key);
      if (existing) {
        existing.units += line.quantity;
      } else {
        belowCost.set(key, {
          variantId: line.variantId,
          sku: line.sku,
          name: line.name,
          channel: line.channel,
          unitPrice: money(line.unitPrice),
          unitCost: money(line.unitCost),
          lossPerUnit: money(line.unitCost - line.unitPrice),
          units: line.quantity,
        });
      }
    }
  }

  const skuRows = aggregateProfitBySku(lines);
  const bottomStart = Math.max(TOP_SKU_LIMIT, skuRows.length - TOP_SKU_LIMIT);

  return {
    range: { from: opts.from.toISOString(), to: opts.to.toISOString(), groupBy: opts.groupBy },
    summary: toMetrics(summary),
    returns: summarizeReturns(lines),
    byChannel: [...byChannel.entries()]
      .map(([channel, acc]) => ({ ...toMetrics(acc), channel }))
      .sort((a, b) => Number(b.grossRevenue) - Number(a.grossRevenue)),
    byPeriod: [...byPeriod.entries()]
      .map(([period, acc]) => ({ ...toMetrics(acc), period }))
      .sort((a, b) => a.period.localeCompare(b.period)),
    topSku: skuRows.slice(0, TOP_SKU_LIMIT),
    bottomSku: skuRows.slice(bottomStart).reverse(),
    belowCost: [...belowCost.values()]
      .sort((a, b) => Number(b.lossPerUnit) * b.units - Number(a.lossPerUnit) * a.units)
      .slice(0, BELOW_COST_LIMIT),
  };
}
