import { signTikTokRequest } from './sign.js';
import type {
  TikTokCallOptions,
  TikTokClient,
  TikTokClientConfig,
  TikTokQueryParams,
  TikTokResponse,
} from './types.js';

/**
 * Minimal TikTok Shop Open API client: builds the signed request, sends it, and normalizes the
 * envelope. Every call carries `app_key`, `timestamp` and `sign` in the query; the access token
 * rides the `x-tts-access-token` HEADER (not the query), and shop-scoped calls add `shop_cipher`
 * (which, with all other query params + the body, enters the signature base). GET puts business
 * params in the query; POST sends a JSON body. Mirrors the Lazada/Shopee clients' shape so the
 * worker stock adapter + web import adapter consume an identical envelope.
 */
export function createTikTokClient(config: TikTokClientConfig): TikTokClient {
  const fetchImpl = config.fetchImpl ?? fetch;
  const nowSeconds = config.now ?? (() => Math.floor(Date.now() / 1000));

  return {
    async call<T = unknown>(
      path: string,
      options: TikTokCallOptions = {},
    ): Promise<TikTokResponse<T>> {
      const timestamp = nowSeconds();
      const query: TikTokQueryParams = { app_key: config.appKey, timestamp };
      if (options.shopCipher) query.shop_cipher = options.shopCipher;
      for (const [key, value] of Object.entries(options.query ?? {})) {
        if (value !== undefined) query[key] = value;
      }

      const bodyString = options.body !== undefined ? JSON.stringify(options.body) : '';
      const sign = signTikTokRequest({
        appSecret: config.appSecret,
        path,
        query,
        body: bodyString,
      });

      const search = new URLSearchParams();
      for (const [key, value] of Object.entries(query)) {
        if (value !== undefined) search.set(key, String(value));
      }
      search.set('sign', sign);

      const headers: Record<string, string> = { 'content-type': 'application/json' };
      if (options.accessToken) headers['x-tts-access-token'] = options.accessToken;

      const init: RequestInit = { method: options.method ?? 'GET', headers };
      if (options.body !== undefined) init.body = bodyString;

      const url = `${config.baseUrl}${path}?${search.toString()}`;
      const response = await fetchImpl(url, init);
      const raw = (await response.json()) as Record<string, unknown>;

      return {
        code: typeof raw.code === 'number' ? raw.code : Number(raw.code ?? -1),
        message: typeof raw.message === 'string' ? raw.message : undefined,
        requestId: typeof raw.request_id === 'string' ? raw.request_id : undefined,
        data: raw.data as T | undefined,
        raw,
      };
    },
  };
}

/** A TikTok Shop envelope is successful when its `code` is 0. */
export function isTikTokSuccess(response: TikTokResponse): boolean {
  return response.code === 0;
}
