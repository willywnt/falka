import type { PairingSessionSummary, ScannerConnectionState } from '../types';

/**
 * Maps a pairing session (or its absence) to the scanner connection state shown
 * in the UI. Extracted so the same derivation is shared by the store and by any
 * code that reacts to the TanStack Query pairing session.
 */
export function connectionStateFromSession(
  session: PairingSessionSummary | null,
): ScannerConnectionState {
  if (!session) return 'idle';

  switch (session.status) {
    case 'CONNECTED':
      return 'connected';
    case 'PENDING':
      return 'pending';
    case 'EXPIRED':
      return 'expired';
    default:
      return 'disconnected';
  }
}
