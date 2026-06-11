'use client';

import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { playScanError, playScanSuccess } from '@/lib/scan-sound';
import { isMobileScannerEnabled } from '@/modules/scanner-pairing/config';
import { useDesktopScannerSocket } from '@/modules/scanner-pairing/hooks/use-desktop-scanner-socket';
import { useActivePairingQuery } from '@/modules/scanner-pairing/hooks/use-pairing-api';
import { useReleasePairingOnNavigate } from '@/modules/scanner-pairing/hooks/use-release-pairing-on-navigate';
import type { BarcodeScannedServerPayload } from '@/modules/scanner-pairing/socket/events';

import { useResolvePurchaseScanMutation } from './use-purchase-orders';
import type { ScannedPurchaseItem } from '../types';

/** Coarse state of the PO phone scanner, for the status indicator. */
export type PoScannerStatus = 'off' | 'idle' | 'waiting' | 'connected' | 'disconnected';

type UsePurchaseScannerOptions = {
  onResolved: (scanned: ScannedPurchaseItem) => void;
  soundEnabled: boolean;
};

/**
 * Mobile scan-to-order for the New Purchase Order page — the same shared pairing
 * flow as POS, but on a PURCHASING pairing so it never collides with a POS or
 * recordings phone. A scanned code resolves to a variant OR a whole bundle →
 * onResolved adds/bumps the PO line, with an audible blip.
 */
export function usePurchaseScanner({ onResolved, soundEnabled }: UsePurchaseScannerOptions): {
  scannerEnabled: boolean;
  status: PoScannerStatus;
} {
  const scannerEnabled = isMobileScannerEnabled();
  const { data: activePairing } = useActivePairingQuery(scannerEnabled);
  const session =
    scannerEnabled && activePairing?.session?.purpose === 'PURCHASING'
      ? activePairing.session
      : null;
  // Leaving the New PO page (client nav) releases the phone; refresh keeps it.
  useReleasePairingOnNavigate(session);
  const resolve = useResolvePurchaseScanMutation();

  const soundRef = useRef(soundEnabled);
  soundRef.current = soundEnabled;

  async function handleBarcodeScanned(payload: BarcodeScannedServerPayload): Promise<void> {
    try {
      const scanned = await resolve.mutateAsync(payload.barcode);
      if (!scanned) {
        if (soundRef.current) playScanError();
        toast.warning('Produk tidak ditemukan', {
          description: `Kode ${payload.barcode} gak cocok dengan SKU atau barcode mana pun.`,
        });
        return;
      }
      onResolved(scanned);
      if (soundRef.current) playScanSuccess();
      const description =
        scanned.kind === 'variant'
          ? `${scanned.variant.productName} · ${scanned.variant.name}`
          : scanned.bundle.name;
      toast.success('Masuk daftar pembelian', { description });
    } catch (error) {
      if (soundRef.current) playScanError();
      toast.error('Scan gagal', {
        description: error instanceof Error ? error.message : 'Terjadi kesalahan',
      });
    }
  }

  useDesktopScannerSocket(session?.id ?? null, handleBarcodeScanned);

  // Surface drops (phone closed the app, went idle, or lost network).
  const wasConnectedRef = useRef(false);
  const [dropped, setDropped] = useState(false);
  const sessionStatus = session?.status ?? null;
  useEffect(() => {
    if (sessionStatus === 'CONNECTED') {
      wasConnectedRef.current = true;
      setDropped(false);
    } else if (wasConnectedRef.current && sessionStatus !== 'PENDING') {
      wasConnectedRef.current = false;
      setDropped(true);
      toast.warning('Scanner ponsel terputus', {
        description: 'Ponsel kamu offline. Buka ulang link scanner atau scan ulang QR-nya.',
      });
    }
  }, [sessionStatus]);

  const status: PoScannerStatus = !scannerEnabled
    ? 'off'
    : sessionStatus === 'CONNECTED'
      ? 'connected'
      : sessionStatus === 'PENDING'
        ? 'waiting'
        : dropped
          ? 'disconnected'
          : 'idle';

  return { scannerEnabled, status };
}
