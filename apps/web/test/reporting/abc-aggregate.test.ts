import { describe, expect, it } from 'vitest';

import { aggregateAbc } from '@/modules/reporting/utils/abc-aggregate';
import type { SoldLine } from '@/modules/reporting/utils/metrics';
import type { ProfitChannel } from '@/modules/reporting/types';

const FROM = new Date('2026-01-01T00:00:00.000Z');
const TO = new Date('2026-01-31T23:59:59.999Z');

function line(overrides: Partial<SoldLine>): SoldLine {
  return {
    date: FROM,
    channel: 'POS' as ProfitChannel,
    variantId: 'v1',
    sku: 'SKU-1',
    name: 'Item 1',
    quantity: 1,
    unitPrice: 100,
    unitCost: 50,
    ...overrides,
  };
}

describe('aggregateAbc', () => {
  it('ranks SKUs by revenue and assigns A/B/C by cumulative share', () => {
    const report = aggregateAbc(
      [
        line({ variantId: 'a', sku: 'A', unitPrice: 800, quantity: 1 }), // 800 → 80% cum → A
        line({ variantId: 'b', sku: 'B', unitPrice: 150, quantity: 1 }), // 950/1000 = 95% → B
        line({ variantId: 'c', sku: 'C', unitPrice: 50, quantity: 1 }), // 100% → C
      ],
      { from: FROM, to: TO },
    );

    expect(report.totalRevenue).toBe('1000.00');
    expect(report.rows.map((r) => r.class)).toEqual(['A', 'B', 'C']);
    expect(report.rows[0]?.cumulativeSharePct).toBe(80);
    expect(report.rows[1]?.cumulativeSharePct).toBe(95);
    expect(report.rows[2]?.cumulativeSharePct).toBe(100);

    const classA = report.classes.find((c) => c.class === 'A');
    expect(classA?.skuCount).toBe(1);
    expect(classA?.revenue).toBe('800.00');
    expect(classA?.revenueSharePct).toBe(80);
  });

  it('merges lines for the same variant before ranking', () => {
    const report = aggregateAbc(
      [
        line({ variantId: 'a', unitPrice: 300, quantity: 2 }), // 600
        line({ variantId: 'a', unitPrice: 300, quantity: 1 }), // +300 = 900
        line({ variantId: 'b', unitPrice: 100, quantity: 1 }),
      ],
      { from: FROM, to: TO },
    );

    expect(report.rows).toHaveLength(2);
    const rowA = report.rows.find((r) => r.variantId === 'a');
    expect(rowA?.revenue).toBe('900.00');
    expect(rowA?.unitsSold).toBe(3);
  });

  it('drops a return-heavy (net ≤ 0) SKU into C without breaking the cumulative total', () => {
    const report = aggregateAbc(
      [
        line({ variantId: 'good', unitPrice: 1000, quantity: 1 }),
        line({ variantId: 'returned', unitPrice: 100, quantity: 1 }),
        line({ variantId: 'returned', unitPrice: 100, quantity: -2 }), // net -100
      ],
      { from: FROM, to: TO },
    );

    const returned = report.rows.find((r) => r.variantId === 'returned');
    expect(returned?.class).toBe('C');
    expect(Number(returned?.revenue)).toBeLessThan(0);
    // Cumulative never exceeds 100% even with a negative-net SKU present.
    expect(Math.max(...report.rows.map((r) => r.cumulativeSharePct ?? 0))).toBeLessThanOrEqual(100);
  });

  it('returns null shares and all-C classes when there is no revenue', () => {
    const report = aggregateAbc([], { from: FROM, to: TO });

    expect(report.totalRevenue).toBe('0.00');
    expect(report.rows).toHaveLength(0);
    expect(report.classes.every((c) => c.revenueSharePct === null)).toBe(true);
  });
});
