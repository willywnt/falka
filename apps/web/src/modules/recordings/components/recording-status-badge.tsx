'use client';

import type { RecordingStatus } from '@prisma/client';

import { RECORDING_STATUS_LABELS } from '../types';
import { getRecordingStatusVariant } from '../utils/recording-display';
import { Badge } from '@/components/ui/badge';

export function RecordingStatusBadge({ status }: { status: RecordingStatus }) {
  return (
    <Badge variant={getRecordingStatusVariant(status)}>{RECORDING_STATUS_LABELS[status]}</Badge>
  );
}
