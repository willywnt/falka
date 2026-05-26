'use client';

import type { RecordingLifecycleStatus } from '../types';
import { Badge } from '@/components/ui/badge';

const STATUS_LABELS: Record<RecordingLifecycleStatus, string> = {
  IDLE: 'Ready',
  REQUESTING_PERMISSION: 'Requesting access',
  RECORDING: 'Recording',
  STOPPING: 'Stopping',
  UPLOADING: 'Uploading',
  COMPLETED: 'Completed',
  FAILED: 'Failed',
};

const STATUS_VARIANTS: Record<
  RecordingLifecycleStatus,
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  IDLE: 'secondary',
  REQUESTING_PERMISSION: 'outline',
  RECORDING: 'destructive',
  STOPPING: 'outline',
  UPLOADING: 'default',
  COMPLETED: 'default',
  FAILED: 'destructive',
};

export function RecordingLifecycleStatusBadge({ status }: { status: RecordingLifecycleStatus }) {
  return <Badge variant={STATUS_VARIANTS[status]}>{STATUS_LABELS[status]}</Badge>;
}
