import { create } from 'zustand';

import type { StationRecordingPhase } from '../socket/events';
import type {
  BarcodeScannedPayload,
  PairingSessionSummary,
  ScannerConnectionState,
} from '../types';
import { connectionStateFromSession } from '../utils/connection-state';

type ScannerPairingState = {
  connectionState: ScannerConnectionState;
  session: PairingSessionSummary | null;
  connectUrl: string | null;
  lastBarcode: string | null;
  lastScannedAt: string | null;
  socketConnected: boolean;
  pairingDialogOpen: boolean;
  countdownOpen: boolean;
  countdownBarcode: string | null;
  countdownSeconds: number;
  blockReason: string | null;
  stationPhase: StationRecordingPhase;
  stationBarcode: string | null;
};

type ScannerPairingActions = {
  setConnectionState: (state: ScannerConnectionState) => void;
  setSession: (session: PairingSessionSummary | null) => void;
  setConnectUrl: (url: string | null) => void;
  setLastScan: (payload: BarcodeScannedPayload | null) => void;
  setSocketConnected: (connected: boolean) => void;
  setPairingDialogOpen: (open: boolean) => void;
  openCountdown: (barcode: string) => void;
  setCountdownSeconds: (seconds: number) => void;
  closeCountdown: () => void;
  setBlockReason: (reason: string | null) => void;
  setStationRecordingState: (phase: StationRecordingPhase, barcode?: string | null) => void;
  reset: () => void;
};

export type ScannerPairingStore = ScannerPairingState & ScannerPairingActions;

const initialState: ScannerPairingState = {
  connectionState: 'idle',
  session: null,
  connectUrl: null,
  lastBarcode: null,
  lastScannedAt: null,
  socketConnected: false,
  pairingDialogOpen: false,
  countdownOpen: false,
  countdownBarcode: null,
  countdownSeconds: 3,
  blockReason: null,
  stationPhase: 'idle',
  stationBarcode: null,
};

export const useScannerPairingStore = create<ScannerPairingStore>((set) => ({
  ...initialState,
  setConnectionState: (connectionState) => set({ connectionState }),
  setSession: (session) => {
    set({ session, connectionState: connectionStateFromSession(session) });
  },
  setConnectUrl: (connectUrl) => set({ connectUrl }),
  setLastScan: (payload) =>
    set({
      lastBarcode: payload?.barcode ?? null,
      lastScannedAt: payload?.scannedAt ?? null,
    }),
  setSocketConnected: (socketConnected) => set({ socketConnected }),
  setPairingDialogOpen: (pairingDialogOpen) => set({ pairingDialogOpen }),
  openCountdown: (barcode) =>
    set({
      countdownOpen: true,
      countdownBarcode: barcode,
      countdownSeconds: 3,
      blockReason: null,
    }),
  setCountdownSeconds: (countdownSeconds) => set({ countdownSeconds }),
  closeCountdown: () =>
    set({
      countdownOpen: false,
      countdownBarcode: null,
      countdownSeconds: 3,
    }),
  setBlockReason: (blockReason) => set({ blockReason }),
  setStationRecordingState: (stationPhase, barcode = null) =>
    set({
      stationPhase,
      stationBarcode: barcode,
    }),
  reset: () => set(initialState),
}));
