'use client';

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { useReducedMotion } from '@/hooks/use-reduced-motion';

import { AXIS_TICK, ChartLegend, CountTooltip, GRID_COLOR, shortPeriod } from './chart-theme';

export type StockFlowDatum = {
  date: string;
  /** Units that entered stock that day (positive deltas). */
  in: number;
  /** Units that left stock that day (positive magnitude of negative deltas). */
  out: number;
};

/**
 * Daily stock flow — units in (green) vs out (ember) per day. Honest units, not
 * money, so it uses the count tooltip. Colors are the theme's signed pair since
 * in/out genuinely read as gain/loss of stock.
 */
export function StockFlowChart({ data }: { data: StockFlowDatum[] }) {
  const reducedMotion = useReducedMotion();

  return (
    <div role="img" aria-label="Grafik arus stok harian: unit masuk vs unit keluar per hari">
      <ChartLegend
        className="mb-2"
        items={[
          { label: 'Masuk', color: 'var(--signed-up)' },
          { label: 'Keluar', color: 'var(--signed-down)' },
        ]}
      />
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 8 }} barGap={2}>
          <CartesianGrid stroke={GRID_COLOR} strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="date"
            tick={AXIS_TICK}
            tickFormatter={shortPeriod}
            tickLine={false}
            axisLine={{ stroke: GRID_COLOR }}
            minTickGap={12}
          />
          <YAxis
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={false}
            width={32}
            allowDecimals={false}
          />
          <Tooltip content={<CountTooltip />} cursor={{ fill: 'var(--muted)' }} />
          <Bar
            name="Masuk"
            dataKey="in"
            fill="var(--signed-up)"
            radius={[3, 3, 0, 0]}
            isAnimationActive={!reducedMotion}
          />
          <Bar
            name="Keluar"
            dataKey="out"
            fill="var(--signed-down)"
            radius={[3, 3, 0, 0]}
            isAnimationActive={!reducedMotion}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
