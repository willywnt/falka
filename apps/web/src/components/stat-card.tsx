import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

/** Tinted icon-chip palettes, so a row of stats/actions isn't one flat colour. */
export const STAT_TONES = {
  primary: 'bg-primary/10 text-primary',
  amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  rose: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
  sky: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
  violet: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
  emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  muted: 'bg-muted text-muted-foreground',
} as const;

export type StatTone = keyof typeof STAT_TONES;

/**
 * A single KPI tile: label + big value, an optional tinted icon chip and a
 * footnote. The shared shape every dashboard/report stat row is built from.
 */
export function StatCard({
  label,
  value,
  icon: Icon,
  tone = 'muted',
  hint,
  accentClassName,
  className,
}: {
  label: string;
  value: ReactNode;
  icon?: LucideIcon;
  tone?: StatTone;
  hint?: ReactNode;
  accentClassName?: string;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardDescription>{label}</CardDescription>
          {Icon ? (
            <span
              className={cn(
                'flex size-8 shrink-0 items-center justify-center rounded-lg',
                STAT_TONES[tone],
              )}
            >
              <Icon className="size-4" />
            </span>
          ) : null}
        </div>
        <CardTitle className={cn('text-2xl tabular-nums', accentClassName)}>{value}</CardTitle>
      </CardHeader>
      {hint ? (
        <CardContent className="pt-0">
          <div className="text-muted-foreground text-xs">{hint}</div>
        </CardContent>
      ) : null}
    </Card>
  );
}
