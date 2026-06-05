'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { BarcodeFormat, BrowserMultiFormatReader } from '@zxing/browser';
import type { IScannerControls } from '@zxing/browser';
import type { Result } from '@zxing/library';

import { normalizeBarcodeValue } from '@/modules/recordings/validators/no-resi';
import { noResiSchema } from '@/modules/recordings/validators/no-resi';

import { PAIRING_ERROR_MESSAGES, PAIRING_ERROR_CODES } from '../errors/pairing-errors';
import { emitBarcodeScanned, getScannerSocket } from '../services/socket-client.service';
import { boundsFromResultPoints, type BarcodeOverlayBounds } from '../utils/barcode-overlay-bounds';
import { getCameraUnavailableMessage, isCameraApiAvailable } from '../utils/camera-environment';
import type { MobileScanHistoryEntry } from '../components/mobile-scan-history';

// QR_CODE first for the POS product labels (printed via the label studio); the
// rest are the 1D logistics symbologies used by packing/recordings shipping labels.
const SUPPORTED_SCAN_FORMATS = [
  BarcodeFormat.QR_CODE,
  BarcodeFormat.CODE_128,
  BarcodeFormat.CODE_39,
  BarcodeFormat.EAN_13,
  BarcodeFormat.EAN_8,
  BarcodeFormat.UPC_A,
  BarcodeFormat.ITF,
  BarcodeFormat.CODABAR,
];

const MAX_SCAN_HISTORY = 30;
const DETECTION_CLEAR_MS = 350;

type UseMobileBarcodeScannerOptions = {
  pairingId: string | null;
  enabled: boolean;
  onScanSuccess?: (barcode: string) => void;
};

export function useMobileBarcodeScanner({
  pairingId,
  enabled,
  onScanSuccess,
}: UseMobileBarcodeScannerOptions) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const lastScanRef = useRef<{ barcode: string; at: number } | null>(null);
  const detectionClearTimerRef = useRef<number | null>(null);

  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [barcodeDetected, setBarcodeDetected] = useState(false);
  const [detectionBounds, setDetectionBounds] = useState<BarcodeOverlayBounds | null>(null);
  const [previewBarcode, setPreviewBarcode] = useState<string | null>(null);
  const [scanHistory, setScanHistory] = useState<MobileScanHistoryEntry[]>([]);

  const clearDetectionHighlight = useCallback(() => {
    if (detectionClearTimerRef.current !== null) {
      window.clearTimeout(detectionClearTimerRef.current);
      detectionClearTimerRef.current = null;
    }
    setBarcodeDetected(false);
    setDetectionBounds(null);
    setPreviewBarcode(null);
  }, []);

  const markBarcodeDetected = useCallback(
    (result: Result) => {
      const points = result.getResultPoints?.() ?? [];
      const bounds = boundsFromResultPoints(
        points.length > 0 ? points : undefined,
        videoRef.current,
        containerRef.current,
      );
      setDetectionBounds(bounds);
      setBarcodeDetected(true);
      setPreviewBarcode(normalizeBarcodeValue(result.getText()));

      if (detectionClearTimerRef.current !== null) {
        window.clearTimeout(detectionClearTimerRef.current);
      }
      detectionClearTimerRef.current = window.setTimeout(() => {
        clearDetectionHighlight();
      }, DETECTION_CLEAR_MS);
    },
    [clearDetectionHighlight],
  );

  const pushScanHistory = useCallback((barcode: string) => {
    const scannedAt = new Date().toISOString();
    setScanHistory((prev) => {
      const next = [{ barcode, scannedAt }, ...prev.filter((e) => e.barcode !== barcode)];
      return next.slice(0, MAX_SCAN_HISTORY);
    });
  }, []);

  const stopScanner = useCallback(() => {
    controlsRef.current?.stop();
    controlsRef.current = null;
    readerRef.current = null;
    setIsScanning(false);
    clearDetectionHighlight();
  }, [clearDetectionHighlight]);

  const startScanner = useCallback(async () => {
    if (!enabled || !pairingId || !videoRef.current) return;

    setCameraError(null);
    stopScanner();

    const blocked = getCameraUnavailableMessage();
    if (blocked) {
      setCameraError(blocked);
      return;
    }

    const reader = new BrowserMultiFormatReader(undefined, {
      delayBetweenScanAttempts: 200,
    });
    reader.possibleFormats = SUPPORTED_SCAN_FORMATS;
    readerRef.current = reader;

    try {
      const controls = await reader.decodeFromVideoDevice(
        undefined,
        videoRef.current,
        async (result, error) => {
          if (!result) {
            if (error && error.name !== 'NotFoundException') {
              // Ignore frame-level decode misses.
            }
            return;
          }

          markBarcodeDetected(result);

          const raw = result.getText();
          const normalized = normalizeBarcodeValue(raw);
          const parsed = noResiSchema.safeParse(normalized);
          if (!parsed.success) return;

          const now = Date.now();
          if (
            lastScanRef.current &&
            lastScanRef.current.barcode === normalized &&
            now - lastScanRef.current.at < 2000
          ) {
            return;
          }
          lastScanRef.current = { barcode: normalized, at: now };

          const socket = getScannerSocket();
          if (!socket.connected) return;

          const ack = await emitBarcodeScanned(socket, pairingId, normalized);
          if (ack.ok) {
            pushScanHistory(normalized);
            onScanSuccess?.(normalized);
          }
        },
      );
      controlsRef.current = controls;
      setIsScanning(true);
    } catch (error) {
      const rawMessage = error instanceof Error ? error.message : 'Failed to start camera';
      const needsHttps =
        rawMessage.includes('getUserMedia') ||
        rawMessage.includes('mediaDevices') ||
        !isCameraApiAvailable();

      const message =
        error instanceof DOMException && error.name === 'NotAllowedError'
          ? PAIRING_ERROR_MESSAGES[PAIRING_ERROR_CODES.CAMERA_PERMISSION_DENIED]
          : needsHttps
            ? (getCameraUnavailableMessage() ?? rawMessage)
            : rawMessage;

      setCameraError(message);
      stopScanner();
    }
  }, [enabled, markBarcodeDetected, onScanSuccess, pairingId, pushScanHistory, stopScanner]);

  useEffect(() => {
    if (enabled && pairingId) {
      void startScanner();
    } else {
      stopScanner();
    }

    return () => stopScanner();
  }, [enabled, pairingId, startScanner, stopScanner]);

  useEffect(() => {
    return () => {
      if (detectionClearTimerRef.current !== null) {
        window.clearTimeout(detectionClearTimerRef.current);
      }
    };
  }, []);

  return {
    videoRef,
    containerRef,
    cameraError,
    isScanning,
    barcodeDetected,
    detectionBounds,
    previewBarcode,
    scanHistory,
    retryCamera: () => void startScanner(),
  };
}
