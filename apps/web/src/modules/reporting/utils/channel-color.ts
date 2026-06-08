/**
 * Stable chart color per sales channel, pulled from the theme's categorical
 * `--chart-*` ramp (OKLCH, defined in globals.css) — NOT the signed pair or
 * destructive. Returns a CSS `var(...)` string that recharts/SVG consume
 * directly so it tracks light/dark automatically. Pair with channelLabel().
 */
const FIXED: Record<string, string> = {
  POS: 'var(--chart-1)', // teal — matches --primary
  SHOPEE: 'var(--chart-3)', // amber
  TOKOPEDIA: 'var(--chart-2)', // violet (Tokopedia green would clash with signed-up)
  LAZADA: 'var(--chart-4)', // blue
};

const CYCLE = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
];

/** A channel's chart color: a fixed hue for known channels, else cycled by index. */
export function channelColor(channel: string, index = 0): string {
  return FIXED[channel] ?? CYCLE[index % CYCLE.length] ?? 'var(--chart-1)';
}
