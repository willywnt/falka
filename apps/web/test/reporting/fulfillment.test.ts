import { describe, expect, it } from 'vitest';

import { aggregateFulfillment } from '@/modules/reporting/utils/fulfillment';

const HOUR = 60 * 60 * 1000;

function at(base: number, hoursLater: number): { placedAt: Date; shippedAt: Date } {
  return { placedAt: new Date(base), shippedAt: new Date(base + hoursLater * HOUR) };
}

describe('aggregateFulfillment', () => {
  it('averages time-to-ship per channel and sorts fastest first', () => {
    const base = 1_700_000_000_000;
    const rows = aggregateFulfillment([
      { channel: 'LAZADA', ...at(base, 12) },
      { channel: 'LAZADA', ...at(base, 24) },
      { channel: 'SHOPEE', ...at(base, 48) },
    ]);

    expect(rows.map((r) => r.channel)).toEqual(['LAZADA', 'SHOPEE']);
    expect(rows[0]).toMatchObject({ channel: 'LAZADA', avgHours: 18, orderCount: 2 });
    expect(rows[1]).toMatchObject({ channel: 'SHOPEE', avgHours: 48, orderCount: 1 });
  });

  it('floors a negative gap (clock skew) to 0', () => {
    const base = 1_700_000_000_000;
    const rows = aggregateFulfillment([{ channel: 'LAZADA', ...at(base, -5) }]);

    expect(rows[0]?.avgHours).toBe(0);
  });

  it('rounds the average to one decimal', () => {
    const base = 1_700_000_000_000;
    const rows = aggregateFulfillment([
      { channel: 'LAZADA', ...at(base, 1) },
      { channel: 'LAZADA', ...at(base, 2) },
      { channel: 'LAZADA', ...at(base, 2) },
    ]);

    expect(rows[0]?.avgHours).toBe(1.7);
  });

  it('returns an empty list for no orders', () => {
    expect(aggregateFulfillment([])).toEqual([]);
  });
});
