import { describe, expect, it } from 'vitest';

import {
  aggregateProfit,
  aggregateProfitBySku,
  type SoldLine,
} from '@/modules/reporting/utils/profit-aggregate';

const opts = {
  from: new Date('2026-06-01'),
  to: new Date('2026-06-30'),
  groupBy: 'day' as const,
};

function line(overrides: Partial<SoldLine>): SoldLine {
  return {
    date: new Date('2026-06-10'),
    channel: 'POS',
    variantId: 'v',
    sku: 'SKU',
    name: 'Name',
    quantity: 1,
    unitPrice: 100,
    unitCost: 60,
    ...overrides,
  };
}

describe('aggregateProfit', () => {
  it('computes margin only over lines whose cost is known', () => {
    const report = aggregateProfit(
      [
        line({ variantId: 'a', sku: 'A', quantity: 2, unitPrice: 100, unitCost: 60 }),
        line({ variantId: 'b', sku: 'B', quantity: 1, unitPrice: 50, unitCost: null }),
      ],
      opts,
    );

    expect(report.summary.grossRevenue).toBe('250.00');
    expect(report.summary.costKnownRevenue).toBe('200.00');
    expect(report.summary.cogs).toBe('120.00');
    expect(report.summary.grossProfit).toBe('80.00');
    expect(report.summary.grossMarginPct).toBe(40);
    expect(report.summary.unitsSold).toBe(3);
    expect(report.summary.costUnknownLines).toBe(1);
  });

  it('returns a null margin when no line has a known cost', () => {
    const report = aggregateProfit([line({ unitCost: null })], opts);
    expect(report.summary.grossMarginPct).toBeNull();
    expect(report.summary.cogs).toBe('0.00');
  });

  it('splits metrics by channel', () => {
    const report = aggregateProfit(
      [
        line({ channel: 'POS', unitPrice: 100, unitCost: 60 }),
        line({ channel: 'SHOPEE', unitPrice: 200, unitCost: 150 }),
      ],
      opts,
    );

    expect(report.byChannel.find((c) => c.channel === 'POS')?.grossProfit).toBe('40.00');
    expect(report.byChannel.find((c) => c.channel === 'SHOPEE')?.grossProfit).toBe('50.00');
  });

  it('flags lines sold below cost with the per-unit loss and total units', () => {
    const report = aggregateProfit(
      [line({ sku: 'LOSS', unitPrice: 50, unitCost: 80, quantity: 3 })],
      opts,
    );

    expect(report.belowCost).toHaveLength(1);
    expect(report.belowCost[0]?.lossPerUnit).toBe('30.00');
    expect(report.belowCost[0]?.units).toBe(3);
  });

  it('nets a processed return (negative-qty line) out of revenue, COGS and units', () => {
    const report = aggregateProfit(
      [
        line({ quantity: 5, unitPrice: 100, unitCost: 60 }),
        line({ quantity: -2, unitPrice: 100, unitCost: 60 }),
      ],
      opts,
    );

    expect(report.summary.grossRevenue).toBe('300.00');
    expect(report.summary.cogs).toBe('180.00');
    expect(report.summary.grossProfit).toBe('120.00');
    expect(report.summary.unitsSold).toBe(3);
    expect(report.returns).toEqual({
      refundedRevenue: '200.00',
      refundedCogs: '120.00',
      units: 2,
      lineCount: 1,
    });
  });

  it('never lets a return reversal land in the below-cost watchlist', () => {
    const report = aggregateProfit(
      [
        line({ sku: 'LOSS', unitPrice: 50, unitCost: 80, quantity: 3 }),
        line({ sku: 'LOSS', unitPrice: 50, unitCost: 80, quantity: -1 }),
      ],
      opts,
    );

    expect(report.belowCost).toHaveLength(1);
    // The 3 sold units are flagged; the returned unit does not subtract from them.
    expect(report.belowCost[0]?.units).toBe(3);
    expect(report.returns.units).toBe(1);
  });
});

describe('aggregateProfitBySku', () => {
  it('sorts SKUs by gross profit, highest first', () => {
    const rows = aggregateProfitBySku([
      line({ variantId: 'low', sku: 'LOW', unitPrice: 100, unitCost: 95 }),
      line({ variantId: 'high', sku: 'HIGH', unitPrice: 100, unitCost: 10 }),
    ]);

    expect(rows.map((row) => row.sku)).toEqual(['HIGH', 'LOW']);
  });
});
