import type { PairingSessionStatus } from '@prisma/client';

export type PairingDeviceInfo = {
  userAgent?: string;
  platform?: string;
  language?: string;
  screen?: string;
};

export type PairingSessionSummary = {
  id: string;
  status: PairingSessionStatus;
  connectedAt: string | null;
  lastSeenAt: string | null;
  expiresAt: string;
  deviceInfo: PairingDeviceInfo | null;
  lastScanAt: string | null;
  lastBarcode: string | null;
  createdAt: string;
};

export type CreatePairingSessionResult = {
  session: PairingSessionSummary;
  connectUrl: string;
  qrPayload: string;
};

export type ActivePairingSessionResult = {
  session: PairingSessionSummary | null;
  connectUrl: string | null;
};

export type BarcodeScannedPayload = {
  barcode: string;
  scannedAt: string;
};

export type ScannerConnectionState = 'idle' | 'pending' | 'connected' | 'disconnected' | 'expired';
