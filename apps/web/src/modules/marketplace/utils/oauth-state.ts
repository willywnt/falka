import { decrypt, encrypt } from '@falka/utils/crypto';

/**
 * The OAuth `state` round-trips the connecting org + actor through the third-party
 * (Lazada) redirect. The callback can't rely on the Falka session cookie (the redirect
 * comes from Lazada, possibly on a different origin), so we encrypt the org/actor into the
 * state with a server secret: an attacker can't forge it, and decryption == authenticity.
 * A short max-age limits replay (the auth code is single-use + ~30 min anyway).
 */

const STATE_MAX_AGE_MS = 15 * 60 * 1000;

type OAuthStatePayload = {
  organizationId: string;
  actorUserId: string;
  issuedAt: number;
};

export function encodeOAuthState(
  input: { organizationId: string; actorUserId: string },
  secret: string,
  now: number = Date.now(),
): string {
  const payload: OAuthStatePayload = { ...input, issuedAt: now };
  return encrypt(JSON.stringify(payload), secret);
}

export function decodeOAuthState(
  state: string,
  secret: string,
  now: number = Date.now(),
): { organizationId: string; actorUserId: string } {
  let payload: OAuthStatePayload;
  try {
    payload = JSON.parse(decrypt(state, secret)) as OAuthStatePayload;
  } catch {
    throw new Error('Invalid OAuth state.');
  }

  if (!payload?.organizationId || !payload?.actorUserId || typeof payload.issuedAt !== 'number') {
    throw new Error('Invalid OAuth state.');
  }
  if (now - payload.issuedAt > STATE_MAX_AGE_MS) {
    throw new Error('OAuth state expired.');
  }

  return { organizationId: payload.organizationId, actorUserId: payload.actorUserId };
}
