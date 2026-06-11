import { STATUS_BADGE_TONES } from '@/components/status-badge';

import type { ReorderStatus } from '../types';

type ReorderStatusDisplay = {
  label: string;
  /** Tailwind classes layered onto a Badge to colour it by urgency. */
  className: string;
};

const REORDER_STATUS_DISPLAY: Record<ReorderStatus, ReorderStatusDisplay> = {
  URGENT: { label: 'Mendesak', className: STATUS_BADGE_TONES.urgent },
  SOON: { label: 'Segera restok', className: STATUS_BADGE_TONES.warn },
  OK: { label: 'Aman', className: STATUS_BADGE_TONES.ok },
  DEAD: { label: 'Stok mati', className: STATUS_BADGE_TONES.neutral },
  NO_DATA: { label: 'Tanpa data', className: 'bg-background text-muted-foreground border-border' },
};

export function reorderStatusDisplay(status: ReorderStatus): ReorderStatusDisplay {
  return REORDER_STATUS_DISPLAY[status];
}
