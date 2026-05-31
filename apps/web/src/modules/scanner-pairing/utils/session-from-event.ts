import type { PairingSessionStatus } from '@prisma/client';

import type { PairingSessionSummary } from '../types';
import type { PairingSessionEventPayload } from '../socket/events';

export function toPairingSessionSummaryFromEvent(
  payload: PairingSessionEventPayload,
): PairingSessionSummary {
  return {
    id: payload.sessionId,
    status: payload.status as PairingSessionStatus,
    connectedAt: null,
    lastSeenAt: null,
    expiresAt: payload.expiresAt,
    deviceInfo: (payload.deviceInfo as PairingSessionSummary['deviceInfo']) ?? null,
    lastScanAt: null,
    lastBarcode: null,
    createdAt: new Date().toISOString(),
  };
}
