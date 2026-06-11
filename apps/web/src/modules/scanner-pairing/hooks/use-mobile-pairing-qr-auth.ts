'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { getSession, signIn, useSession } from 'next-auth/react';

type UseMobilePairingQrAuthOptions = {
  pairingId: string | null;
  pairingCode: string | null;
};

const CLAIM_ERROR_MESSAGE =
  'QR ini tidak bisa diverifikasi. Scan kode baru dari desktop, atau masuk manual.';

async function waitForClientSession(maxAttempts = 8): Promise<boolean> {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const session = await getSession();
    if (session?.user?.id) {
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, 80 * (attempt + 1)));
  }
  return false;
}

/**
 * Signs the phone in as the OWNER of a scanned pairing QR. A scan IS the
 * authorization: we (re)claim via the pairing-code credentials provider even when
 * a different account is already signed in on this device — otherwise a stale
 * login makes every pairing request 403 (the session belongs to the desktop user,
 * not the phone's). `claimPending` keeps `isAuthLoading` true until the claim for
 * the current code settles, so the connect flow never fires as the wrong user.
 */
export function useMobilePairingQrAuth({ pairingId, pairingCode }: UseMobilePairingQrAuthOptions) {
  const { status, update } = useSession();
  const [claimError, setClaimError] = useState<string | null>(null);
  const [isClaiming, setIsClaiming] = useState(false);
  // The (pairingId:pairingCode) we've finished a claim attempt for. A fresh QR
  // clears it (re-claim); resolving it lets the connect flow proceed.
  const [resolvedKey, setResolvedKey] = useState<string | null>(null);
  const attemptingRef = useRef(false);

  const attemptKey = pairingId && pairingCode ? `${pairingId}:${pairingCode}` : null;
  const claimPending = attemptKey !== null && resolvedKey !== attemptKey;

  const runClaim = useCallback(async () => {
    if (!pairingId || !pairingCode || attemptingRef.current) return;
    const key = `${pairingId}:${pairingCode}`;

    attemptingRef.current = true;
    setIsClaiming(true);
    setClaimError(null);

    try {
      // The QR is the credential — this re-issues the session cookie for the
      // pairing's owner, overriding whatever (if anything) was signed in before.
      const result = await signIn('credentials', { pairingId, pairingCode, redirect: false });
      await update();
      await waitForClientSession();

      // `ok && !error` is the real signal: a stale different-user session would
      // otherwise look "signed in" even though THIS claim failed.
      setClaimError(result?.ok && !result.error ? null : CLAIM_ERROR_MESSAGE);
    } catch {
      setClaimError(CLAIM_ERROR_MESSAGE);
    } finally {
      setIsClaiming(false);
      setResolvedKey(key);
      attemptingRef.current = false;
    }
  }, [pairingCode, pairingId, update]);

  // A new code (re)scan resets the resolved marker so it claims as the new owner.
  useEffect(() => {
    setResolvedKey(null);
  }, [attemptKey]);

  useEffect(() => {
    if (!attemptKey || status === 'loading') return;
    if (resolvedKey === attemptKey || attemptingRef.current) return;
    void runClaim();
  }, [attemptKey, resolvedKey, runClaim, status]);

  const retryClaim = useCallback(() => {
    setResolvedKey(null);
    setClaimError(null);
  }, []);

  const isAuthenticated = status === 'authenticated' && !claimPending;

  return {
    isAuthenticated,
    isAuthLoading: status === 'loading' || isClaiming || claimPending,
    isClaiming,
    claimError,
    retryClaim,
  };
}
