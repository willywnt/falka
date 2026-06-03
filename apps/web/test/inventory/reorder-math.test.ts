import { describe, expect, it } from 'vitest';

import { REORDER_DEFAULTS } from '@/modules/inventory/config';
import {
  bucketEffectiveDays,
  bucketWeight,
  classifyReorder,
  computeDaysOfCover,
  computeReorderQty,
  computeWeightedVelocity,
  netUnitsSold,
  SALES_LEDGER_REASONS,
} from '@/modules/inventory/utils/reorder-math';

/**
 * Locks in the reorder math driving the report: how raw ledger sums become
 * velocity, days-of-cover, a suggested reorder quantity, and an urgency bucket —
 * including the awkward cases (brand-new variants, oversold stock, returns,
 * dead stock with no demand).
 */
describe('SALES_LEDGER_REASONS', () => {
  it('counts reserve and release as demand, but never ship (avoids double-count)', () => {
    expect(SALES_LEDGER_REASONS).toContain('ORDER_RESERVE');
    expect(SALES_LEDGER_REASONS).toContain('ORDER_RELEASE');
    expect(SALES_LEDGER_REASONS).not.toContain('ORDER_SHIP');
  });
});

describe('netUnitsSold', () => {
  it('flips the sign of a negative ledger sum into positive units sold', () => {
    expect(netUnitsSold(-42)).toBe(42);
  });

  it('clamps to zero when returns outweigh sales (net positive sum)', () => {
    expect(netUnitsSold(5)).toBe(0);
  });

  it('treats a zero sum as no demand', () => {
    expect(netUnitsSold(0)).toBe(0);
  });
});

describe('bucketWeight', () => {
  it('weights the most recent bucket fully', () => {
    expect(bucketWeight(0, 0.6)).toBe(1);
  });

  it('decays geometrically for older buckets', () => {
    expect(bucketWeight(2, 0.5)).toBe(0.25);
  });

  it('is flat (moving average) when decay is 1', () => {
    expect(bucketWeight(3, 1)).toBe(1);
  });
});

describe('bucketEffectiveDays', () => {
  it('is the full bucket span when the variant predates it', () => {
    // bucket covers ages [7, 14); variant is 100 days old
    expect(bucketEffectiveDays(100, 7, 14)).toBe(7);
  });

  it('clamps to the variant age inside the bucket', () => {
    // variant is 10 days old; bucket [7, 14) → only 3 sellable days
    expect(bucketEffectiveDays(10, 7, 14)).toBe(3);
  });

  it('is zero for a bucket entirely before the variant existed', () => {
    expect(bucketEffectiveDays(5, 7, 14)).toBe(0);
  });
});

describe('computeWeightedVelocity', () => {
  it('reduces to a plain moving average when decay is 1', () => {
    // 12 units over 4 buckets of 5 days = 20 days total → 0.6/day
    expect(computeWeightedVelocity([3, 3, 3, 3], [5, 5, 5, 5], 1)).toBeCloseTo(0.6, 10);
  });

  it('skews toward recent demand when decay < 1', () => {
    const flat = computeWeightedVelocity([2, 2, 2, 2], [5, 5, 5, 5], 0.6);
    const recentHeavy = computeWeightedVelocity([8, 0, 0, 0], [5, 5, 5, 5], 0.6);
    expect(recentHeavy).toBeGreaterThan(flat);
  });

  it('ignores buckets with no sellable days (young variant)', () => {
    // only the most recent bucket has real days → 4 units / 5 days
    expect(computeWeightedVelocity([4, 0, 0, 0], [5, 0, 0, 0], 0.6)).toBeCloseTo(0.8, 10);
  });

  it('is zero when there are no sellable days at all', () => {
    expect(computeWeightedVelocity([0, 0, 0, 0], [0, 0, 0, 0], 0.6)).toBe(0);
  });

  it('clamps a net-negative bucket (returns) to zero', () => {
    // recent bucket net -3 (more returns than sales) → treated as 0
    expect(computeWeightedVelocity([-3, 0, 0, 0], [5, 0, 0, 0], 0.6)).toBe(0);
  });
});

describe('computeDaysOfCover', () => {
  it('divides available stock by velocity', () => {
    expect(computeDaysOfCover(20, 2)).toBe(10);
  });

  it('returns null when there is no measurable demand', () => {
    expect(computeDaysOfCover(20, 0)).toBeNull();
  });

  it('returns zero when out of stock', () => {
    expect(computeDaysOfCover(0, 2)).toBe(0);
  });

  it('returns zero when oversold (negative available)', () => {
    expect(computeDaysOfCover(-5, 2)).toBe(0);
  });
});

describe('computeReorderQty', () => {
  const base = { dailyVelocity: 2, leadTimeDays: 7, targetCoverDays: 30 };

  it('orders up to the lead+target horizon, netting on-hand stock', () => {
    // target = 2 * (7 + 30) = 74; need = 74 - 10 = 64
    expect(computeReorderQty({ ...base, available: 10, incoming: 0 })).toBe(64);
  });

  it('subtracts stock already incoming', () => {
    // target 74; on-hand+incoming = 10 + 20 = 30; need = 44
    expect(computeReorderQty({ ...base, available: 10, incoming: 20 })).toBe(44);
  });

  it('suggests nothing when already above the horizon', () => {
    expect(computeReorderQty({ ...base, available: 100, incoming: 0 })).toBe(0);
  });

  it('covers the backlog when oversold', () => {
    // target 74; on-hand -6; need = 80
    expect(computeReorderQty({ ...base, available: -6, incoming: 0 })).toBe(80);
  });

  it('rounds fractional needs up to whole units', () => {
    // target = 1.5 * 37 = 55.5; need = 55.5 - 0 = 55.5 → 56
    expect(
      computeReorderQty({
        available: 0,
        incoming: 0,
        dailyVelocity: 1.5,
        leadTimeDays: 7,
        targetCoverDays: 30,
      }),
    ).toBe(56);
  });

  it('suggests nothing without demand', () => {
    expect(computeReorderQty({ ...base, dailyVelocity: 0, available: 0, incoming: 0 })).toBe(0);
  });

  it('raises a needed reorder up to the MOQ', () => {
    // need = 74 - 70 = 4, but MOQ is 20
    expect(computeReorderQty({ ...base, available: 70, incoming: 0, minOrderQty: 20 })).toBe(20);
  });

  it('keeps the computed qty when it already exceeds the MOQ', () => {
    // need = 64, MOQ 20 → 64
    expect(computeReorderQty({ ...base, available: 10, incoming: 0, minOrderQty: 20 })).toBe(64);
  });

  it('does not let a MOQ force an order when none is needed', () => {
    expect(computeReorderQty({ ...base, available: 100, incoming: 0, minOrderQty: 20 })).toBe(0);
  });
});

describe('classifyReorder', () => {
  const base = {
    leadTimeDays: 7,
    targetCoverDays: 30,
    variantAgeDays: 120,
    deadStockDays: REORDER_DEFAULTS.deadStockDays,
  };

  it('flags URGENT when cover is within the lead time', () => {
    expect(classifyReorder({ ...base, available: 10, dailyVelocity: 2, daysOfCover: 5 })).toBe(
      'URGENT',
    );
  });

  it('flags SOON below the reorder-up-to horizon', () => {
    expect(classifyReorder({ ...base, available: 40, dailyVelocity: 2, daysOfCover: 20 })).toBe(
      'SOON',
    );
  });

  it('is OK when comfortably above the horizon', () => {
    expect(classifyReorder({ ...base, available: 200, dailyVelocity: 2, daysOfCover: 100 })).toBe(
      'OK',
    );
  });

  it('flags DEAD when holding stock with no sales past the dead-stock age', () => {
    expect(classifyReorder({ ...base, available: 25, dailyVelocity: 0, daysOfCover: null })).toBe(
      'DEAD',
    );
  });

  it('is NO_DATA when there is no demand and the variant is still young', () => {
    expect(
      classifyReorder({
        ...base,
        variantAgeDays: 5,
        available: 25,
        dailyVelocity: 0,
        daysOfCover: null,
      }),
    ).toBe('NO_DATA');
  });

  it('is NO_DATA when there is no demand and no stock to strand', () => {
    expect(classifyReorder({ ...base, available: 0, dailyVelocity: 0, daysOfCover: null })).toBe(
      'NO_DATA',
    );
  });
});
