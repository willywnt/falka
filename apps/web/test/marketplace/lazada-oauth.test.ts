import { exchangeLazadaCode, refreshLazadaToken } from '@palka/marketplace-providers';
import { describe, expect, it } from 'vitest';

/**
 * Pins the Lazada OAuth token helpers against a recorded /auth/token/create response.
 * The token fields live at the TOP LEVEL of the envelope (siblings of `code`), not under
 * `data`, so this guards that we read them from raw — plus the signed POST shape (no
 * access_token; the code/refresh_token in the body) and the error path.
 */

function fakeFetch(body: Record<string, unknown>) {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const impl = (async (url: string, init?: RequestInit) => {
    calls.push({ url, init });
    return { json: async () => body } as Response;
  }) as unknown as typeof fetch;
  return { impl, calls };
}

const TOKEN_BODY = {
  code: '0',
  request_id: 'req-1',
  access_token: 'AT-123',
  refresh_token: 'RT-456',
  expires_in: 2_592_000,
  refresh_expires_in: 15_552_000,
  account: 'seller@toko.id',
  country: 'id',
  country_user_info: [{ country: 'id', user_id: 'U1', seller_id: 'S1', short_code: 'SC1' }],
};

const BASE = {
  appKey: 'app-key',
  appSecret: 'app-secret',
  baseUrl: 'https://api.lazada.co.id/rest',
};

describe('exchangeLazadaCode', () => {
  it('parses top-level token fields and signs a no-token POST to /auth/token/create', async () => {
    const { impl, calls } = fakeFetch(TOKEN_BODY);

    const result = await exchangeLazadaCode({
      ...BASE,
      code: 'auth-code-xyz',
      fetchImpl: impl,
      now: () => 1_700_000_000_000,
    });

    expect(result.accessToken).toBe('AT-123');
    expect(result.refreshToken).toBe('RT-456');
    expect(result.expiresIn).toBe(2_592_000);
    expect(result.refreshExpiresIn).toBe(15_552_000);
    expect(result.country).toBe('id');
    expect(result.countryUserInfo[0]?.seller_id).toBe('S1');

    expect(calls).toHaveLength(1);
    const call = calls[0];
    expect(call?.url).toContain('/auth/token/create?');
    expect(call?.url).toContain('app_key=app-key');
    expect(call?.url).toContain('sign=');
    expect(call?.url).not.toContain('access_token='); // token-create is unauthenticated
    expect(call?.init?.method).toBe('POST');
    expect(String(call?.init?.body)).toContain('code=auth-code-xyz');
  });

  it('throws on a non-zero envelope code', async () => {
    const { impl } = fakeFetch({ code: 'IncompleteSignature', message: 'bad sign' });
    await expect(exchangeLazadaCode({ ...BASE, code: 'x', fetchImpl: impl })).rejects.toThrow(
      /token exchange failed.*IncompleteSignature/,
    );
  });
});

describe('refreshLazadaToken', () => {
  it('posts the refresh_token to /auth/token/refresh and parses the rotated tokens', async () => {
    const { impl, calls } = fakeFetch({
      ...TOKEN_BODY,
      access_token: 'AT-new',
      refresh_token: 'RT-new',
    });

    const result = await refreshLazadaToken({ ...BASE, refreshToken: 'RT-old', fetchImpl: impl });

    expect(result.accessToken).toBe('AT-new');
    expect(result.refreshToken).toBe('RT-new');
    const call = calls[0];
    expect(call?.url).toContain('/auth/token/refresh?');
    expect(String(call?.init?.body)).toContain('refresh_token=RT-old');
  });
});
