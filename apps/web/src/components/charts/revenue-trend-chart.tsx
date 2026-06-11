'use client';

import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { useReducedMotion } from '@/hooks/use-reduced-motion';

import {
  AXIS_TICK,
  ChartLegend,
  CurrencyTooltip,
  GRID_COLOR,
  shortPeriod,
  shortRupiah,
} from './chart-theme';

export type RevenueTrendDatum = {
  period: string;
  /** Net revenue for the period (rupiah). */
  revenue: number;
  /** Gross profit for the period (rupiah). */
  profit: number;
};

/**
 * The signature Laba chart: net revenue as a soft teal area with gross profit as
 * a green line riding over it. Colors come from the theme (--primary teal,
 * --signed-up green); the consumer Number()-parses the decimal-string money first.
 */
export function RevenueTrendChart({ data }: { data: RevenueTrendDatum[] }) {
  const reducedMotion = useReducedMotion();

  return (
    <div role="img" aria-label="Grafik tren omzet dan laba kotor per periode">
      <ChartLegend
        className="mb-2"
        items={[
          { label: 'Omzet', color: 'var(--primary)' },
          { label: 'Laba', color: 'var(--signed-up)' },
        ]}
      />
      <ResponsiveContainer width="100%" height={260}>
        <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
          <defs>
            <linearGradient id="revenueArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.18} />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
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
          <Area
            type="monotone"
            name="Omzet"
            dataKey="revenue"
            stroke="var(--primary)"
            strokeWidth={2}
            fill="url(#revenueArea)"
            isAnimationActive={!reducedMotion}
            animationDuration={600}
          />
          <Line
            type="monotone"
            name="Laba"
            dataKey="profit"
            stroke="var(--signed-up)"
            strokeWidth={2}
            dot={false}
            isAnimationActive={!reducedMotion}
            animationDuration={600}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
