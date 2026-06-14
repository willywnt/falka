import { decodeOAuthState, encodeOAuthState } from '@/modules/marketplace/utils/oauth-state';
import { describe, expect, it } from 'vitest';

/**
 * The OAuth state authenticates the connecting org/actor across the Lazada redirect without
 * relying on the session cookie, so it must round-trip cleanly and reject forged, wrong-key,
 * or stale states.
 */
const SECRET = 'unit-test-secret-at-least-32-chars-long!!';
const OTHER_SECRET = 'a-different-secret-also-32-chars-long!!!!!';

describe('oauth state', () => {
  it('round-trips org + actor with the right secret', () => {
    const state = encodeOAuthState(
      { organizationId: 'org-1', actorUserId: 'user-1' },
      SECRET,
      1_000,
    );
    expect(decodeOAuthState(state, SECRET, 1_000)).toEqual({
      organizationId: 'org-1',
      actorUserId: 'user-1',
    });
  });

  it('rejects a garbage/forged state', () => {
    expect(() => decodeOAuthState('not-a-real-state', SECRET)).toThrow(/Invalid OAuth state/);
  });

  it('rejects a state sealed with a different secret', () => {
    const state = encodeOAuthState({ organizationId: 'o', actorUserId: 'a' }, SECRET);
    expect(() => decodeOAuthState(state, OTHER_SECRET)).toThrow(/Invalid OAuth state/);
  });

  it('rejects an expired state (> 15 min old)', () => {
    const state = encodeOAuthState({ organizationId: 'o', actorUserId: 'a' }, SECRET, 0);
    expect(() => decodeOAuthState(state, SECRET, 16 * 60 * 1000)).toThrow(/expired/);
  });
});
