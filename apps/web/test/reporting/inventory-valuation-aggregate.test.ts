import { describe, expect, it } from 'vitest';

import {
  aggregateInventoryValuation,
  type ValuationVariant,
} from '@/modules/reporting/utils/inventory-valuation-aggregate';

function variant(overrides: Partial<ValuationVariant>): ValuationVariant {
  return {
    productId: 'p1',
    productName: 'Product 1',
    category: null,
    available: 10,
    cost: 5,
    ...overrides,
  };
}

describe('aggregateInventoryValuation', () => {
  it('values on-hand stock at cost and rolls it up per product', () => {
    const report = aggregateInventoryValuation([
      variant({ productId: 'p1', available: 10, cost: 5 }),
      variant({ productId: 'p1', available: 4, cost: 2.5 }),
      variant({ productId: 'p2', productName: 'Product 2', available: 3, cost: 100 }),
    ]);

    expect(report.summary.totalStockValue).toBe('360'); // 50 + 10 + 300
    expect(report.summary.availableUnits).toBe(17);
    expect(report.summary.valuedVariants).toBe(3);
    expect(report.summary.costUnknownVariants).toBe(0);
    // Highest-value product first.
    expect(report.byProduct.map((p) => p.productId)).toEqual(['p2', 'p1']);
    expect(report.byProduct.find((p) => p.productId === 'p1')?.stockValue).toBe('60');
  });

  it('excludes a missing-cost variant from value but flags it when in stock', () => {
    const report = aggregateInventoryValuation([
      variant({ productId: 'p1', available: 10, cost: 5 }),
      variant({ productId: 'p1', available: 7, cost: null }),
    ]);

    expect(report.summary.totalStockValue).toBe('50');
    expect(report.summary.costUnknownVariants).toBe(1);
    expect(report.summary.valuedVariants).toBe(1);
    expect(report.byProduct[0]?.costUnknownVariants).toBe(1);
    expect(report.byProduct[0]?.availableUnits).toBe(17);
  });

  it('omits products with no units on hand and ignores their zero-stock cost-unknown variants', () => {
    const report = aggregateInventoryValuation([
      variant({ productId: 'p1', available: 5, cost: 4 }),
      variant({ productId: 'empty', productName: 'Empty', available: 0, cost: null }),
    ]);

    expect(report.byProduct).toHaveLength(1);
    expect(report.byProduct[0]?.productId).toBe('p1');
    expect(report.summary.totalVariants).toBe(2);
    expect(report.summary.costUnknownVariants).toBe(0);
  });
});
