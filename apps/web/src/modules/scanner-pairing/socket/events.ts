/** Client → server socket events. */
export const CLIENT_SOCKET_EVENTS = {
  JOIN_PAIRING: 'join_pairing',
  LEAVE_PAIRING: 'leave_pairing',
  BARCODE_SCANNED: 'barcode_scanned',
  SCANNER_HEARTBEAT: 'scanner_heartbeat',
  DISCONNECT_PAIRING: 'disconnect_pairing',
  REPORT_STATION_STATE: 'report_station_state',
} as const;

/** Server → client socket events. */
export const SERVER_SOCKET_EVENTS = {
  PAIRING_CONNECTED: 'pairing_connected',
  PAIRING_DISCONNECTED: 'pairing_disconnected',
  BARCODE_SCANNED: 'barcode_scanned',
  BARCODE_ACK: 'barcode_ack',
  RECORDING_TRIGGERED: 'recording_triggered',
  STATION_RECORDING_STATE: 'station_recording_state',
  PAIRING_ERROR: 'pairing_error',
  SESSION_STATE: 'session_state',
} as const;

export type ClientSocketEvent = (typeof CLIENT_SOCKET_EVENTS)[keyof typeof CLIENT_SOCKET_EVENTS];

export type ServerSocketEvent = (typeof SERVER_SOCKET_EVENTS)[keyof typeof SERVER_SOCKET_EVENTS];

export type JoinPairingPayload = {
  pairingId: string;
  role: 'desktop' | 'mobile';
};

export type BarcodeScannedClientPayload = {
  pairingId: string;
  barcode: string;
};

export type BarcodeScannedServerPayload = {
  barcode: string;
  scannedAt: string;
};

export type BarcodeAckPayload = {
  barcode: string;
  success: boolean;
  message?: string;
};

export type PairingSessionEventPayload = {
  sessionId: string;
  status: string;
  expiresAt: string;
  deviceInfo?: Record<string, unknown> | null;
};

export type PairingErrorPayload = {
  code: string;
  message: string;
};

export type RecordingTriggeredPayload = {
  barcode: string;
  pairingSessionId: string;
};

export type StationRecordingPhase = 'idle' | 'countdown' | 'recording' | 'uploading';

export type StationRecordingStatePayload = {
  phase: StationRecordingPhase;
  barcode?: string;
  updatedAt: string;
};

export type ReportStationStatePayload = {
  pairingId: string;
  phase: StationRecordingPhase;
  barcode?: string;
};

export type SocketAckResponse<T = unknown> =
  | { ok: true; data?: T }
  | { ok: false; error: PairingErrorPayload };
