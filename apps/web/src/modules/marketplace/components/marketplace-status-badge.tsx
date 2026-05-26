'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

import type { MarketplaceConnectionStatus } from '../types';
import { MARKETPLACE_CONNECTION_STATUS_LABELS } from '../types';

const STATUS_VARIANTS: Record<
  MarketplaceConnectionStatus,
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  connected: 'default',
  disconnected: 'secondary',
  expired: 'destructive',
};

export function MarketplaceStatusBadge({
  status,
  className,
}: {
  status: MarketplaceConnectionStatus;
  className?: string;
}) {
  return (
    <Badge variant={STATUS_VARIANTS[status]} className={cn('font-medium', className)}>
      {MARKETPLACE_CONNECTION_STATUS_LABELS[status]}
    </Badge>
  );
}
