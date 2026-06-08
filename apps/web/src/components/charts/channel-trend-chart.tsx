'use client';

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { AXIS_TICK, CurrencyTooltip, GRID_COLOR, shortPeriod, shortRupiah } from './chart-theme';

export type ChannelTrendSeries = { key: string; label: string; color: string };

/**
 * Stacked-area trend of net revenue per channel over time. Each datum is a
 * period row keyed by channel ({ period, POS: n, SHOPEE: n, ... }); one stacked
 * Area per series in the given order/color. Renders the channel×period matrix
 * the table used to show as numbers.
 */
export function ChannelTrendChart({
  data,
  series,
}: {
  data: Array<Record<string, number | string>>;
  series: ChannelTrendSeries[];
}) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
        <CartesianGrid stroke={GRID_COLOR} strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="period"
          tick={AXIS_TICK}
          tickFormatter={shortPeriod}
          tickLine={false}
          axisLine={{ stroke: GRID_COLOR }}
          minTickGap={16}
        />
        <YAxis
          tick={AXIS_TICK}
          tickFormatter={shortRupiah}
          tickLine={false}
          axisLine={false}
          width={48}
        />
        <Tooltip content={<CurrencyTooltip />} cursor={{ stroke: GRID_COLOR }} />
        {series.map((entry) => (
          <Area
            key={entry.key}
            type="monotone"
            stackId="rev"
            dataKey={entry.key}
            name={entry.label}
            stroke={entry.color}
            fill={entry.color}
            fillOpacity={0.18}
            strokeWidth={1.5}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}
