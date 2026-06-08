'use client';

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

import { CurrencyTooltip } from './chart-theme';

export type ChannelDonutDatum = {
  name: string;
  /** Net revenue for the channel (rupiah) — slice size mirrors revenue share. */
  value: number;
  color: string;
};

/**
 * Revenue-share donut per channel. Slices are sized by net revenue (so the ring
 * IS the share), colored from the theme channel ramp, with a center caption for
 * the headline total. Hairline gaps via a card-colored stroke.
 */
export function ChannelDonutChart({
  data,
  centerPrimary,
  centerSecondary,
}: {
  data: ChannelDonutDatum[];
  centerPrimary: string;
  centerSecondary?: string;
}) {
  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Tooltip content={<CurrencyTooltip />} />
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius="62%"
            outerRadius="92%"
            paddingAngle={1.5}
            strokeWidth={2}
            stroke="var(--card)"
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="num text-lg font-semibold">{centerPrimary}</span>
        {centerSecondary ? (
          <span className="text-muted-foreground text-xs">{centerSecondary}</span>
        ) : null}
      </div>
    </div>
  );
}
