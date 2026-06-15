import type { ChannelFulfillmentRow, ProfitChannel } from '../types';

const HOUR_MS = 60 * 60 * 1000;

export type FulfillmentInput = {
  channel: ProfitChannel;
  placedAt: Date;
  shippedAt: Date;
};

/**
 * Mean time-to-ship per channel: hours from `placedAt` to `shippedAt`, averaged
 * over the orders given. Pure — the server feeds it shipped/completed orders that
 * carry a ship timestamp. A non-positive gap (clock skew / same instant) is
 * floored to 0 so it never reports a negative SLA. Sorted fastest channel first.
 */
export function aggregateFulfillment(rows: FulfillmentInput[]): ChannelFulfillmentRow[] {
  const byChannel = new Map<ProfitChannel, { totalHours: number; orderCount: number }>();

  for (const row of rows) {
    const hours = Math.max(0, (row.shippedAt.getTime() - row.placedAt.getTime()) / HOUR_MS);
    const acc = byChannel.get(row.channel) ?? { totalHours: 0, orderCount: 0 };
    acc.totalHours += hours;
    acc.orderCount += 1;
    byChannel.set(row.channel, acc);
  }

  return [...byChannel.entries()]
    .map(([channel, acc]) => ({
      channel,
      avgHours: Math.round((acc.totalHours / acc.orderCount) * 10) / 10,
      orderCount: acc.orderCount,
    }))
    .sort((a, b) => a.avgHours - b.avgHours);
}
