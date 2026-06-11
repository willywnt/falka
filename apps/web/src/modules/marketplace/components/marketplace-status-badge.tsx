'use client';

import { StatusBadge, type StatusTone } from '@/components/status-badge';

import type { MarketplaceConnectionStatus } from '../types';
import { MARKETPLACE_CONNECTION_STATUS_LABELS } from '../types';

const STATUS_TONES: Record<MarketplaceConnectionStatus, StatusTone> = {
  connected: 'ok',
  disconnected: 'neutral',
  expired: 'danger',
};

export function MarketplaceStatusBadge({
  status,
  className,
}: {
  status: MarketplaceConnectionStatus;
  className?: string;
}) {
  return (
    <StatusBadge tone={STATUS_TONES[status]} className={className}>
      {MARKETPLACE_CONNECTION_STATUS_LABELS[status]}
    </StatusBadge>
  );
}
