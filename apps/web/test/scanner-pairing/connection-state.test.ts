import { describe, expect, it } from 'vitest';
import type { PairingSessionStatus } from '@prisma/client';

import { connectionStateFromSession } from '@/modules/scanner-pairing/utils/connection-state';
import type { PairingSessionSummary } from '@/modules/scanner-pairing/types';

function session(status: PairingSessionStatus): PairingSessionSummary {
  return {
    id: 'pair-1',
    status,
    connectedAt: null,
    lastSeenAt: null,
    expiresAt: '2099-01-01T00:00:00.000Z',
    deviceInfo: null,
    lastScanAt: null,
    lastBarcode: null,
    createdAt: '2026-06-03T00:00:00.000Z',
  };
}

/**
 * Pins the session -> connectionState mapping before Fase C2 moves the pairing
 * session out of Zustand into TanStack Query; the same derivation must hold
 * wherever connectionState is computed.
 */
describe('connectionStateFromSession', () => {
  it('maps a null session to idle', () => {
    expect(connectionStateFromSession(null)).toBe('idle');
  });

  it('maps CONNECTED to connected', () => {
    expect(connectionStateFromSession(session('CONNECTED'))).toBe('connected');
  });

  it('maps PENDING to pending', () => {
    expect(connectionStateFromSession(session('PENDING'))).toBe('pending');
  });

  it('maps EXPIRED to expired', () => {
    expect(connectionStateFromSession(session('EXPIRED'))).toBe('expired');
  });

  it('maps DISCONNECTED (and any other status) to disconnected', () => {
    expect(connectionStateFromSession(session('DISCONNECTED'))).toBe('disconnected');
  });
});
