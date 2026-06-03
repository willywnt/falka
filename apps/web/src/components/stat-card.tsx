import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

/**
 * A single KPI tile: label + big value, an optional corner icon and a footnote.
 * The shared shape every dashboard/report stat row is built from.
 */
export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  accentClassName,
  className,
}: {
  label: string;
  value: ReactNode;
  icon?: LucideIcon;
  hint?: ReactNode;
  accentClassName?: string;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardDescription>{label}</CardDescription>
          {Icon ? <Icon className="text-muted-foreground size-4 shrink-0" /> : null}
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
