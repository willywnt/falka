/** Pending session TTL before mobile connects (minutes). */
export const PAIRING_PENDING_TTL_MS = 10 * 60 * 1000;

/** Connected session extended TTL on each heartbeat (minutes). */
export const PAIRING_CONNECTED_TTL_MS = 30 * 60 * 1000;

/** Mobile heartbeat interval (ms). */
export const SCANNER_HEARTBEAT_INTERVAL_MS = 5_000;

/** Mark scanner disconnected if no heartbeat within (ms). */
export const SCANNER_HEARTBEAT_STALE_MS = 15_000;

/** Ignore duplicate barcode scans within (ms). */
export const BARCODE_SCAN_DEBOUNCE_MS = 2_000;

/** Auto-recording countdown seconds. */
export const RECORDING_COUNTDOWN_SECONDS = 3;

export const SOCKET_PATH = '/api/socket';

export const PAIRING_ROOM_PREFIX = 'pairing:';

export function pairingRoomId(sessionId: string): string {
  return `${PAIRING_ROOM_PREFIX}${sessionId}`;
}
