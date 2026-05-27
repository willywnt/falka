'use client';

import type { OperationalRecordingStatus } from '../types/operational-recording-status';
import { OPERATIONAL_STATUS_LABELS } from '../types/operational-recording-status';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const OPERATIONAL_STATUS_STYLES: Record<OperationalRecordingStatus, string> = {
  IDLE: 'border-transparent bg-secondary text-secondary-foreground',
  RECORDING: 'border-transparent bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200',
  PROCESSING: 'border-transparent bg-secondary text-secondary-foreground',
  PENDING_UPLOAD: 'border-transparent bg-secondary text-secondary-foreground',
  UPLOADING: 'border-transparent bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200',
  COMPLETED:
    'border-transparent bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200',
  FAILED: 'border-transparent bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-200',
};

export function OperationalStatusBadge({ status }: { status: OperationalRecordingStatus }) {
  return (
    <Badge variant="outline" className={cn(OPERATIONAL_STATUS_STYLES[status])}>
      {OPERATIONAL_STATUS_LABELS[status]}
    </Badge>
  );
}
