import { BARCODE_SCAN_DEBOUNCE_MS } from '../config';

type DebounceEntry = {
  barcode: string;
  at: number;
};

const recentScans = new Map<string, DebounceEntry>();

export function isDuplicateScan(sessionId: string, barcode: string): boolean {
  const key = sessionId;
  const now = Date.now();
  const entry = recentScans.get(key);

  if (entry && entry.barcode === barcode && now - entry.at < BARCODE_SCAN_DEBOUNCE_MS) {
    return true;
  }

  recentScans.set(key, { barcode, at: now });
  return false;
}

export function clearScanDebounce(sessionId: string): void {
  recentScans.delete(sessionId);
}
