'use client';

import type { OperationalRecordingStatus } from '../types/operational-recording-status';
import { OPERATIONAL_STATUS_LABELS } from '../types/operational-recording-status';
import type { StatusTone } from '@/components/status-badge';
import { StatusBadge } from '@/components/status-badge';

const OPERATIONAL_STATUS_TONES: Record<OperationalRecordingStatus, StatusTone> = {
  IDLE: 'neutral',
  RECORDING: 'warn',
  PROCESSING: 'info',
  PENDING_UPLOAD: 'warn',
  UPLOADING: 'info',
  COMPLETED: 'ok',
  FAILED: 'danger',
};

export function OperationalStatusBadge({ status }: { status: OperationalRecordingStatus }) {
  return (
    <StatusBadge tone={OPERATIONAL_STATUS_TONES[status]}>
      {OPERATIONAL_STATUS_LABELS[status]}
    </StatusBadge>
  );
}
