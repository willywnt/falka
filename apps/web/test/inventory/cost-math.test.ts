import { describe, expect, it } from 'vitest';

import { computeMovingAverageCost } from '@/modules/inventory/utils/cost-math';

describe('computeMovingAverageCost', () => {
  it('weights the current cost against the received cost', () => {
    // 10 @ 100 + 10 @ 120 -> (1000 + 1200) / 20 = 110
    expect(
      computeMovingAverageCost({
        onHandQty: 10,
        currentCost: 100,
        receivedQty: 10,
        receivedCost: 120,
      }),
    ).toBe(110);
  });

  it('rounds to 2 decimals', () => {
    // 3 @ 100 + 1 @ 150 -> 450 / 4 = 112.5
    expect(
      computeMovingAverageCost({
        onHandQty: 3,
        currentCost: 100,
        receivedQty: 1,
        receivedCost: 150,
      }),
    ).toBe(112.5);
  });

  it('adopts the received cost on the first-ever receive (no current cost)', () => {
    expect(
      computeMovingAverageCost({
        onHandQty: 0,
        currentCost: null,
        receivedQty: 5,
        receivedCost: 80,
      }),
    ).toBe(80);
  });

  it('adopts the received cost when on-hand is zero or negative (oversold)', () => {
    expect(
      computeMovingAverageCost({
        onHandQty: 0,
        currentCost: 100,
        receivedQty: 5,
        receivedCost: 90,
      }),
    ).toBe(90);
    expect(
      computeMovingAverageCost({
        onHandQty: -4,
        currentCost: 100,
        receivedQty: 5,
        receivedCost: 90,
      }),
    ).toBe(90);
  });

  it('adopts the received cost when the current cost is zero', () => {
    expect(
      computeMovingAverageCost({ onHandQty: 10, currentCost: 0, receivedQty: 5, receivedCost: 70 }),
    ).toBe(70);
  });

  it('leaves the cost unchanged when the received cost is not usable', () => {
    expect(
      computeMovingAverageCost({
        onHandQty: 10,
        currentCost: 100,
        receivedQty: 5,
        receivedCost: 0,
      }),
    ).toBeNull();
    expect(
      computeMovingAverageCost({
        onHandQty: 10,
        currentCost: 100,
        receivedQty: 0,
        receivedCost: 90,
      }),
    ).toBeNull();
  });
});
