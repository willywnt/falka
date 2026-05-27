'use client';

import type { RecordingLifecycleStatus } from '../types';
import { mapLifecycleToOperational } from '../types/operational-recording-status';
import { OperationalStatusBadge } from './operational-status-badge';

export function RecordingLifecycleStatusBadge({ status }: { status: RecordingLifecycleStatus }) {
  return <OperationalStatusBadge status={mapLifecycleToOperational(status)} />;
}
