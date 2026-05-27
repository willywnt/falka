'use client';

import type { RecordingStatus } from '@prisma/client';

import { mapServerStatusToOperational } from '../types/operational-recording-status';
import { OperationalStatusBadge } from './operational-status-badge';

export function RecordingStatusBadge({ status }: { status: RecordingStatus }) {
  return <OperationalStatusBadge status={mapServerStatusToOperational(status)} />;
}
