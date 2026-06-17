import { buildTikTokSignBase, signTikTokRequest } from '@falka/marketplace-providers';
import { describe, expect, it } from 'vitest';

/**
 * Pins the TikTok Shop Open API signing algorithm (the Tokopedia channel's API). TikTok signs
 * `app_secret + path + sorted(key+value, excl. sign/access_token) + body + app_secret`, then
 * HMAC-SHA256 lower-hex. The expected signature was computed independently, so these catch any
 * regression in the base-string assembly (ordering + exclusions + the secret-wrap).
 */
describe('buildTikTokSignBase', () => {
  it('wraps path + sorted params + body with the app secret, sorted by key', () => {
    expect(
      buildTikTokSignBase({
        appSecret: 'tiktok-secret',
        path: '/product/202309/products/search',
        query: { app_key: 'app-123', timestamp: 1700000000, shop_cipher: 'CIPHER9', page_size: 50 },
        body: '{}',
      }),
    ).toBe(
      'tiktok-secret/product/202309/products/search' +
        'app_keyapp-123page_size50shop_cipherCIPHER9timestamp1700000000' +
        '{}tiktok-secret',
    );
  });

  it('excludes sign and access_token from the base string', () => {
    const withExtras = buildTikTokSignBase({
      appSecret: 's',
      path: '/x',
      query: { app_key: 'k', timestamp: 1, sign: 'IGNORED', access_token: 'tok' },
    });
    const without = buildTikTokSignBase({
      appSecret: 's',
      path: '/x',
      query: { app_key: 'k', timestamp: 1 },
    });
    expect(withExtras).toBe(without);
  });
});

describe('signTikTokRequest', () => {
  it('produces lower-case HMAC-SHA256 hex matching the precomputed vector', () => {
    const sign = signTikTokRequest({
      appSecret: 'tiktok-secret',
      path: '/product/202309/products/search',
      query: { app_key: 'app-123', timestamp: 1700000000, shop_cipher: 'CIPHER9', page_size: 50 },
      body: '{}',
    });

    expect(sign).toBe('79e152e8d741e85d2ea1519338ead781a86560a5d341183558fbac7ff3a49f79');
    expect(sign).toMatch(/^[0-9a-f]{64}$/);
  });

  it('is independent of input key order (params are sorted before signing)', () => {
    const a = signTikTokRequest({
      appSecret: 's',
      path: '/x',
      query: { a: '1', b: '2', c: '3' },
    });
    const b = signTikTokRequest({
      appSecret: 's',
      path: '/x',
      query: { c: '3', a: '1', b: '2' },
    });
    expect(b).toBe(a);
  });
});
