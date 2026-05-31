'use client';

import { useEffect } from 'react';

import { SCANNER_HEARTBEAT_INTERVAL_MS } from '../config';
import { getScannerSocket, scannerSocketEvents } from '../services/socket-client.service';

export function useMobileHeartbeat(pairingId: string | null, enabled: boolean): void {
  useEffect(() => {
    if (!enabled || !pairingId) return;

    const socket = getScannerSocket();

    const tick = () => {
      if (socket.connected) {
        socket.emit(scannerSocketEvents.client.SCANNER_HEARTBEAT, { pairingId });
      }
    };

    tick();
    const interval = window.setInterval(tick, SCANNER_HEARTBEAT_INTERVAL_MS);

    return () => window.clearInterval(interval);
  }, [enabled, pairingId]);
}
