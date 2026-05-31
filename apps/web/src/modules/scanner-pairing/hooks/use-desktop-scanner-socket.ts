'use client';

import { useEffect, useRef } from 'react';

import {
  connectScannerPairing,
  subscribeScannerBarcode,
} from '../services/scanner-socket-manager.service';
import type { BarcodeScannedServerPayload } from '../services/socket-client.service';

/**
 * Single desktop subscription for pairing socket events (avoids duplicate listeners
 * when connect dialog and recording panel both mount).
 */
export function useDesktopScannerSocket(
  pairingId: string | null,
  onBarcodeScanned?: (payload: BarcodeScannedServerPayload) => void,
): void {
  const onBarcodeRef = useRef(onBarcodeScanned);
  onBarcodeRef.current = onBarcodeScanned;

  useEffect(() => {
    if (!pairingId) return;

    void connectScannerPairing(pairingId, 'desktop');

    return subscribeScannerBarcode((payload) => {
      void onBarcodeRef.current?.(payload);
    });
  }, [pairingId]);
}
