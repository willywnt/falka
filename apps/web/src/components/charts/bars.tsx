import { cn } from '@/lib/utils';

/** A thin horizontal track filled to `pct`% — for inline table cells (share, return rate). */
export function TrackBar({
  pct,
  color = 'var(--primary)',
  className,
}: {
  pct: number;
  color?: string;
  className?: string;
}) {
  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <div className={cn('bg-muted h-1.5 w-full overflow-hidden rounded-full', className)}>
      <div
        className="h-full rounded-full"
        style={{ width: `${clamped}%`, backgroundColor: color }}
      />
    </div>
  );
}

export type CompositionSegment = { value: number; color: string; label: string };

/** A single stacked bar showing a composition (e.g. available / reserved / damaged). */
export function CompositionBar({
  segments,
  className,
}: {
  segments: CompositionSegment[];
  className?: string;
}) {
  const total = segments.reduce((sum, seg) => sum + Math.max(0, seg.value), 0);
  return (
    <div
      className={cn(
        'flex h-2 w-full overflow-hidden rounded-full',
        total === 0 && 'bg-muted',
        className,
      )}
    >
      {total > 0
        ? segments.map((seg) =>
            seg.value > 0 ? (
              <div
                key={seg.label}
                title={`${seg.label}: ${seg.value}`}
                style={{ width: `${(seg.value / total) * 100}%`, backgroundColor: seg.color }}
              />
            ) : null,
          )
        : null}
    </div>
  );
}

export type ValueRankRow = {
  id: string;
  label: string;
  sublabel?: string;
  value: number;
  flagged?: boolean;
};

/**
 * A horizontal value ranking — label + proportional bar + formatted value per row.
 * Bars scale to the largest row. `flagged` rows draw in the highlight (amber) hue.
 */
export function ValueRankList({
  rows,
  formatValue,
  color = 'var(--primary)',
  flaggedColor = 'var(--highlight)',
}: {
  rows: ValueRankRow[];
  formatValue: (value: number) => string;
  color?: string;
  flaggedColor?: string;
}) {
  const max = Math.max(...rows.map((row) => row.value), 1);
  return (
    <ul className="space-y-2.5">
      {rows.map((row) => (
        <li key={row.id} className="space-y-1">
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 truncate font-medium">
              {row.label}
              {row.sublabel ? (
                <span className="text-muted-foreground font-normal"> · {row.sublabel}</span>
              ) : null}
            </span>
            <span className="num shrink-0">{formatValue(row.value)}</span>
          </div>
          <TrackBar pct={(row.value / max) * 100} color={row.flagged ? flaggedColor : color} />
        </li>
      ))}
    </ul>
  );
}
