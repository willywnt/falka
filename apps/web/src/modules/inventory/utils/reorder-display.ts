import type { ReorderStatus } from '../types';

type ReorderStatusDisplay = {
  label: string;
  /** Tailwind classes layered onto a Badge to colour it by urgency. */
  className: string;
};

const REORDER_STATUS_DISPLAY: Record<ReorderStatus, ReorderStatusDisplay> = {
  URGENT: { label: 'Urgent', className: 'border-transparent bg-destructive text-white' },
  SOON: { label: 'Reorder soon', className: 'border-transparent bg-amber-500 text-white' },
  OK: { label: 'OK', className: 'border-transparent bg-emerald-500/15 text-emerald-700' },
  DEAD: { label: 'Dead stock', className: 'bg-muted text-muted-foreground' },
  NO_DATA: { label: 'No data', className: 'text-muted-foreground' },
};

export function reorderStatusDisplay(status: ReorderStatus): ReorderStatusDisplay {
  return REORDER_STATUS_DISPLAY[status];
}
