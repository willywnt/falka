'use client';

import { useEffect, useRef } from 'react';

import type { PairingSessionSummary } from '../types';
import { useDisconnectPairingMutation } from './use-pairing-api';

/**
 * Release the paired phone when the operator LEAVES a scan station by client-side
 * navigation — so a phone paired to POS / purchasing / opname doesn't linger
 * "connected" on a station you've moved away from. A full-page refresh or tab
 * close (beforeunload / pagehide) is deliberately preserved: the session survives
 * the reload and the station re-attaches to it.
 *
 * `session` should already be the caller's purpose-matched session (the scanner
 * hooks pass `null` for a mismatched purpose), so we only ever release our own.
 */
export function useReleasePairingOnNavigate(session: PairingSessionSummary | null): void {
  const disconnect = useDisconnectPairingMutation();
  const disconnectRef = useRef(disconnect.mutate);
  disconnectRef.current = disconnect.mutate;

  // The id we'd release, set only while the session is actually live. Kept in a
  // ref so the unmount cleanup sees the latest value (and so React Strict Mode's
  // mount-probe, which runs before any session loads, finds null and no-ops).
  const releasableIdRef = useRef<string | null>(null);
  releasableIdRef.current =
    session && (session.status === 'CONNECTED' || session.status === 'PENDING') ? session.id : null;

  useEffect(() => {
    let unloading = false;
    const markUnloading = () => {
      unloading = true;
    };
    window.addEventListener('beforeunload', markUnloading);
    window.addEventListener('pagehide', markUnloading);

    return () => {
      window.removeEventListener('beforeunload', markUnloading);
      window.removeEventListener('pagehide', markUnloading);
      // Refresh / close keeps the pairing; only a client-side nav releases it.
      if (unloading) return;
      const id = releasableIdRef.current;
      if (id) disconnectRef.current(id);
    };
  }, []);
}
