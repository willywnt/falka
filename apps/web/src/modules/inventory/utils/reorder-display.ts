import type { ReorderStatus } from '../types';

type ReorderStatusDisplay = {
  label: string;
  /** Tailwind classes layered onto a Badge to colour it by urgency. */
  className: string;
};

const REORDER_STATUS_DISPLAY: Record<ReorderStatus, ReorderStatusDisplay> = {
  URGENT: { label: 'Mendesak', className: 'border-transparent bg-destructive text-white' },
  SOON: { label: 'Segera restok', className: 'border-transparent bg-amber-500 text-white' },
  OK: {
    label: 'Aman',
    className: 'border-transparent bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  },
  DEAD: { label: 'Stok mati', className: 'border-transparent bg-muted text-muted-foreground' },
  NO_DATA: { label: 'Tanpa data', className: 'bg-background text-muted-foreground border-border' },
};

export function reorderStatusDisplay(status: ReorderStatus): ReorderStatusDisplay {
  return REORDER_STATUS_DISPLAY[status];
}
