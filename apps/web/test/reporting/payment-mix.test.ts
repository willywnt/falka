import { describe, expect, it } from 'vitest';

import { computePaymentMix } from '@/modules/reporting/utils/payment-mix';

describe('computePaymentMix', () => {
  it('computes each method share and sorts by amount desc', () => {
    const rows = computePaymentMix([
      { method: 'QRIS', amount: 30_000, salesCount: 3 },
      { method: 'CASH', amount: 70_000, salesCount: 5 },
    ]);

    expect(rows.map((r) => r.method)).toEqual(['CASH', 'QRIS']);
    expect(rows[0]).toMatchObject({ method: 'CASH', salesCount: 5, sharePct: 70 });
    expect(rows[1]).toMatchObject({ method: 'QRIS', salesCount: 3, sharePct: 30 });
    expect(rows[0]?.amount).toBe('70000.00');
  });

  it('returns null share when the total is 0', () => {
    const rows = computePaymentMix([{ method: 'CASH', amount: 0, salesCount: 0 }]);

    expect(rows[0]?.sharePct).toBeNull();
    expect(rows[0]?.amount).toBe('0.00');
  });

  it('returns an empty list for no sales', () => {
    expect(computePaymentMix([])).toEqual([]);
  });

  it('rounds shares to two decimals', () => {
    const rows = computePaymentMix([
      { method: 'CASH', amount: 1, salesCount: 1 },
      { method: 'QRIS', amount: 2, salesCount: 1 },
    ]);

    const cash = rows.find((r) => r.method === 'CASH');
    expect(cash?.sharePct).toBe(33.33);
  });
});
