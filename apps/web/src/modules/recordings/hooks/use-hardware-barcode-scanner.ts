'use client';

import type { HardwareBarcodeScanResult } from '@/modules/recordings/utils/hardware-barcode';

export type { HardwareBarcodeScanResult };

export type UseHardwareBarcodeScannerOptions = {
  /** Enable keyboard-wedge listener when the recording form is idle. */
  enabled: boolean;
  /** Input element id for the resi field (default: `trackingNumber`). */
  resiInputId?: string;
  /**
   * Called when a valid 1D barcode scan is received.
   * Future integration should only prefill resi here — not auto-start recording.
   */
  onScan: (result: HardwareBarcodeScanResult) => void;
};

/**
 * Placeholder for USB keyboard-wedge 1D barcode scanner support.
 *
 * Wire this hook in `RecordingPanel` in a future update:
 * ```tsx
 * useHardwareBarcodeScanner({
 *   enabled: canStart && !anotherTabRecording,
 *   onScan: ({ trackingNumber }) => setTrackingNumber(trackingNumber),
 * });
 * ```
 */
export function useHardwareBarcodeScanner(_options: UseHardwareBarcodeScannerOptions) {
  // Intentionally no-op until hardware scanner support is implemented.
}
