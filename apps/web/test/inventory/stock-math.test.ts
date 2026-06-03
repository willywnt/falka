import { describe, expect, it } from 'vitest';

import {
  computeBalanceAfter,
  isManualStockReason,
  MANUAL_STOCK_REASONS,
} from '@/modules/inventory/utils/stock-math';

/**
 * Locks in the available-stock math used by every manual adjustment: stock may
 * never go negative, a zero delta is a no-op error, and only manual reasons are
 * selectable from the adjust API.
 */
describe('computeBalanceAfter', () => {
  it('adds a positive delta to the current balance', () => {
    expect(computeBalanceAfter(10, 5)).toEqual({ ok: true, balanceAfter: 15 });
  });

  it('subtracts a negative delta down to zero', () => {
    expect(computeBalanceAfter(5, -5)).toEqual({ ok: true, balanceAfter: 0 });
  });

  it('starts from zero for a brand-new variant', () => {
    expect(computeBalanceAfter(0, 8)).toEqual({ ok: true, balanceAfter: 8 });
  });

  it('rejects an adjustment that would go below zero', () => {
    expect(computeBalanceAfter(3, -4)).toEqual({ ok: false, reason: 'insufficient_stock' });
  });

  it('rejects a zero delta as a no-op', () => {
    expect(computeBalanceAfter(10, 0)).toEqual({ ok: false, reason: 'zero_delta' });
  });
});

describe('isManualStockReason', () => {
  it('accepts every reason exposed for manual adjustments', () => {
    for (const reason of MANUAL_STOCK_REASONS) {
      expect(isManualStockReason(reason)).toBe(true);
    }
  });

  it('rejects system-driven reasons', () => {
    expect(isManualStockReason('ORDER_RESERVE')).toBe(false);
    expect(isManualStockReason('ORDER_SHIP')).toBe(false);
    expect(isManualStockReason('MARKETPLACE_SYNC')).toBe(false);
  });
});
