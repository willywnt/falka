import { describe, expect, it } from 'vitest';

import { computeBuildableQty } from '@/modules/catalog/utils/bundle';

describe('computeBuildableQty', () => {
  it('is the minimum buildable across components', () => {
    // 10 / 1 = 10 ; 6 / 2 = 3 -> min 3
    expect(
      computeBuildableQty([
        { quantity: 1, availableStock: 10 },
        { quantity: 2, availableStock: 6 },
      ]),
    ).toBe(3);
  });

  it('is zero with no components', () => {
    expect(computeBuildableQty([])).toBe(0);
  });

  it('is zero when any component is out of stock', () => {
    expect(
      computeBuildableQty([
        { quantity: 1, availableStock: 5 },
        { quantity: 1, availableStock: 0 },
      ]),
    ).toBe(0);
  });

  it('clamps an oversold (negative) component to zero', () => {
    expect(
      computeBuildableQty([
        { quantity: 1, availableStock: 5 },
        { quantity: 1, availableStock: -3 },
      ]),
    ).toBe(0);
  });

  it('ignores components with a non-positive per-bundle quantity', () => {
    expect(
      computeBuildableQty([
        { quantity: 0, availableStock: 100 },
        { quantity: 2, availableStock: 8 },
      ]),
    ).toBe(4);
  });
});
