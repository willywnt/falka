import { describe, expect, it } from 'vitest';

import { allocateProportionally, computeSaleTotals } from '@/modules/sales/utils/sale-totals';

describe('computeSaleTotals', () => {
  it('passes through with no discount and no tax', () => {
    expect(computeSaleTotals(100_000, null, 0, false)).toEqual({
      subtotal: 100_000,
      discountAmount: 0,
      taxableBase: 100_000,
      taxAmount: 0,
      totalAmount: 100_000,
    });
  });

  it('applies a percent discount', () => {
    const totals = computeSaleTotals(200_000, { type: 'PERCENT', value: 10 }, 0, false);
    expect(totals.discountAmount).toBe(20_000);
    expect(totals.totalAmount).toBe(180_000);
  });

  it('clamps a fixed discount to the subtotal and a percent to 100', () => {
    expect(computeSaleTotals(50_000, { type: 'AMOUNT', value: 80_000 }, 0, false).totalAmount).toBe(
      0,
    );
    expect(
      computeSaleTotals(50_000, { type: 'PERCENT', value: 150 }, 0, false).discountAmount,
    ).toBe(50_000);
  });

  it('adds exclusive PPN on top of the discounted base', () => {
    const totals = computeSaleTotals(100_000, { type: 'AMOUNT', value: 10_000 }, 11, false);
    expect(totals.taxableBase).toBe(90_000);
    expect(totals.taxAmount).toBe(9_900);
    expect(totals.totalAmount).toBe(99_900);
  });

  it('carves inclusive PPN out of the base without changing the total', () => {
    const totals = computeSaleTotals(111_000, null, 11, true);
    expect(totals.totalAmount).toBe(111_000);
    expect(totals.taxAmount).toBe(11_000);
    // Net revenue = total - tax in both modes.
    expect(totals.totalAmount - totals.taxAmount).toBe(100_000);
  });

  it('never returns a negative discount or tax', () => {
    const totals = computeSaleTotals(10_000, { type: 'AMOUNT', value: -5 }, -11, false);
    expect(totals.discountAmount).toBe(0);
    expect(totals.taxAmount).toBe(0);
    expect(totals.totalAmount).toBe(10_000);
  });
});

describe('allocateProportionally', () => {
  it('splits by weight and sums exactly to the whole', () => {
    const parts = allocateProportionally(10_000, [75_000, 25_000]);
    expect(parts).toEqual([7_500, 2_500]);
  });

  it('hands leftover cents to the largest fractional shares', () => {
    const parts = allocateProportionally(100, [1, 1, 1]);
    const cents = parts.map((part) => Math.round(part * 100));
    expect(cents.reduce((sum, part) => sum + part, 0)).toBe(10_000);
    expect(Math.max(...cents) - Math.min(...cents)).toBeLessThanOrEqual(1);
  });

  it('returns zeros for a zero amount or zero weights', () => {
    expect(allocateProportionally(0, [10, 20])).toEqual([0, 0]);
    expect(allocateProportionally(5_000, [0, 0])).toEqual([0, 0]);
  });
});
