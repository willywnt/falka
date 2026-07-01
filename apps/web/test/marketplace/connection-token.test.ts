import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Pins the shared web token wrapper used by drift + order pull: PROACTIVE refresh of a near-expiry
 * token, REACTIVE refresh-and-retry when the provider rejects the token (a stored expiry can overstate
 * the real life), pass-through on success, and rethrow of a non-auth error without refreshing.
 * isAuthShopeeError is the REAL classifier; only env/queue/crypto collaborators are mocked.
 */
const { refreshMock, expiringMock, decryptMock } = vi.hoisted(() => ({
  refreshMock: vi.fn(),
  expiringMock: vi.fn(() => false),
  decryptMock: vi.fn(() => 'stored-token'),
}));

vi.mock('@palka/config/env.server', () => ({
  getServerEnv: () => ({ MARKETPLACE_ENCRYPTION_SECRET: 'secret' }),
}));
vi.mock('@palka/queue', () => ({
  isTokenExpiringSoon: expiringMock,
  refreshAndPersistConnectionToken: refreshMock,
}));
vi.mock('@/modules/marketplace/services/encryption.service', () => ({
  marketplaceEncryptionService: { safeDecryptToken: decryptMock },
}));

const { runWithFreshConnectionToken } =
  await import('@/modules/marketplace/services/connection-token.service');

const CONNECTION = {
  id: 'conn-1',
  provider: 'SHOPEE' as const,
  encryptedAccessToken: 'enc-access',
  encryptedRefreshToken: 'enc-refresh',
  tokenExpiresAt: null,
  shopId: 'shop-1',
};

beforeEach(() => {
  refreshMock.mockReset();
  expiringMock.mockReturnValue(false);
  decryptMock.mockReturnValue('stored-token');
});

describe('runWithFreshConnectionToken', () => {
  it('uses the stored token and does not refresh when not expiring + the call succeeds', async () => {
    const run = vi.fn(async (token: string) => `ok:${token}`);

    const result = await runWithFreshConnectionToken(CONNECTION, run);

    expect(result).toBe('ok:stored-token');
    expect(refreshMock).not.toHaveBeenCalled();
    expect(run).toHaveBeenCalledTimes(1);
  });

  it('PROACTIVELY refreshes a near-expiry token before the call', async () => {
    expiringMock.mockReturnValue(true);
    refreshMock.mockResolvedValue({ accessToken: 'fresh-token', tokenExpiresAt: new Date() });
    const run = vi.fn(async (token: string) => `ok:${token}`);

    const result = await runWithFreshConnectionToken(CONNECTION, run);

    expect(result).toBe('ok:fresh-token');
    expect(refreshMock).toHaveBeenCalledTimes(1);
    expect(run).toHaveBeenCalledWith('fresh-token');
  });

  it('REACTIVELY refreshes + retries once when the provider rejects the token', async () => {
    refreshMock.mockResolvedValue({ accessToken: 'reauth-token', tokenExpiresAt: new Date() });
    const run = vi
      .fn()
      .mockRejectedValueOnce(new Error('Shopee order pull failed (error_auth: Wrong token).'))
      .mockResolvedValueOnce('ok:retried');

    const result = await runWithFreshConnectionToken(CONNECTION, run);

    expect(result).toBe('ok:retried');
    expect(refreshMock).toHaveBeenCalledTimes(1);
    expect(run).toHaveBeenCalledTimes(2);
    expect(run).toHaveBeenLastCalledWith('reauth-token');
  });

  it('rethrows a NON-auth error without refreshing', async () => {
    const run = vi.fn().mockRejectedValue(new Error('Network down'));

    await expect(runWithFreshConnectionToken(CONNECTION, run)).rejects.toThrow('Network down');
    expect(refreshMock).not.toHaveBeenCalled();
    expect(run).toHaveBeenCalledTimes(1);
  });
});
