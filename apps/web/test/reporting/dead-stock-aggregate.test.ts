import { describe, expect, it } from 'vitest';

import {
  aggregateDeadStock,
  type DeadStockVariant,
} from '@/modules/reporting/utils/dead-stock-aggregate';

function variant(overrides: Partial<DeadStockVariant>): DeadStockVariant {
  return {
    variantId: 'v1',
    productId: 'p1',
    productName: 'Product 1',
    variantName: 'Variant 1',
    variantGroup: null,
    sku: 'SKU-1',
    available: 10,
    cost: 5,
    daysSinceLastSale: 90,
    ageDays: 120,
    ...overrides,
  };
}

describe('aggregateDeadStock', () => {
  it('flags variants idle past the threshold and values the stuck capital', () => {
    const report = aggregateDeadStock(
      [
        variant({ variantId: 'v1', available: 10, cost: 5, daysSinceLastSale: 90 }),
        variant({ variantId: 'v2', available: 4, cost: 100, daysSinceLastSale: 70 }),
      ],
      { staleDays: 60 },
    );

    expect(report.summary.deadSkuCount).toBe(2);
    expect(report.summary.stuckValue).toBe('450'); // 50 + 400
    expect(report.summary.idleUnits).toBe(14);
    // Highest stuck value first.
    expect(report.rows.map((r) => r.variantId)).toEqual(['v2', 'v1']);
  });

  it('excludes variants that sold within the threshold', () => {
    const report = aggregateDeadStock(
      [
        variant({ variantId: 'fresh', daysSinceLastSale: 10 }),
        variant({ variantId: 'stale', daysSinceLastSale: 80 }),
      ],
      { staleDays: 60 },
    );

    expect(report.rows.map((r) => r.variantId)).toEqual(['stale']);
  });

  it('excludes out-of-stock variants — there is no capital stuck', () => {
    const report = aggregateDeadStock([variant({ available: 0, daysSinceLastSale: 200 })], {
      staleDays: 60,
    });

    expect(report.summary.deadSkuCount).toBe(0);
    expect(report.rows).toHaveLength(0);
  });

  it('treats a never-sold variant as dead only once it is older than the threshold', () => {
    const report = aggregateDeadStock(
      [
        variant({ variantId: 'new', daysSinceLastSale: null, ageDays: 20 }),
        variant({ variantId: 'old', daysSinceLastSale: null, ageDays: 200 }),
      ],
      { staleDays: 60 },
    );

    expect(report.rows.map((r) => r.variantId)).toEqual(['old']);
    expect(report.rows[0]?.status).toBe('NEVER_SOLD');
    expect(report.rows[0]?.daysSinceLastSale).toBeNull();
    expect(report.rows[0]?.idleDays).toBe(200);
    expect(report.summary.neverSoldCount).toBe(1);
  });

  it('keeps a cost-unknown variant in the list but excludes it from stuck value', () => {
    const report = aggregateDeadStock(
      [
        variant({ variantId: 'priced', cost: 5, available: 10, daysSinceLastSale: 90 }),
        variant({ variantId: 'unpriced', cost: null, available: 8, daysSinceLastSale: 90 }),
      ],
      { staleDays: 60 },
    );

    expect(report.summary.deadSkuCount).toBe(2);
    expect(report.summary.stuckValue).toBe('50');
    expect(report.summary.costUnknownCount).toBe(1);
    expect(report.summary.idleUnits).toBe(18);
    const unpriced = report.rows.find((r) => r.variantId === 'unpriced');
    expect(unpriced?.cost).toBeNull();
    expect(unpriced?.stockValue).toBe('0');
  });
});
