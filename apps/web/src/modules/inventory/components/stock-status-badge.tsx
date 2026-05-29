'use client';

import type { StockHealthStatus } from '../utils/stock-health';
import { STOCK_HEALTH_LABELS } from '../utils/stock-health';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const VARIANT_STYLES: Record<StockHealthStatus, string> = {
  healthy: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  low_stock: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400',
  out_of_stock: 'border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400',
};

export function StockStatusBadge({
  status,
  className,
}: {
  status: StockHealthStatus;
  className?: string;
}) {
  return (
    <Badge variant="outline" className={cn(VARIANT_STYLES[status], className)}>
      {STOCK_HEALTH_LABELS[status]}
    </Badge>
  );
}
