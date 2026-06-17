/**
 * TikTok Shop Open API client types. This is the API the **Tokopedia channel** runs on now —
 * the standalone developer.tokopedia.com API was terminated and ID sellers integrate via the
 * TikTok Shop Partner Center ("Tokopedia & Shop"). Naming here is `TikTok` (the API); the
 * marketplace adapters key it to the `TOKOPEDIA` provider enum.
 */

export type TikTokQueryValue = string | number | boolean | undefined;
export type TikTokQueryParams = Record<string, TikTokQueryValue>;

/** A TikTok Shop response envelope, normalized to camelCase. `code === 0` is success. */
export type TikTokResponse<T = unknown> = {
  code: number;
  message?: string;
  requestId?: string;
  data?: T;
  raw: Record<string, unknown>;
};

export type TikTokCallOptions = {
  method?: 'GET' | 'POST';
  /** Seller access token — sent as the `x-tts-access-token` header (NOT a query param). */
  accessToken?: string;
  /**
   * Opaque shop identifier returned at authorization. Required on every shop-scoped call;
   * travels as the `shop_cipher` query param and is part of the signature base.
   */
  shopCipher?: string;
  /** Business query params (GET filters + paging). Signed alongside the system params. */
  query?: TikTokQueryParams;
  /** JSON request body (POST). Its serialized string is part of the signature base. */
  body?: unknown;
};

export interface TikTokClient {
  call<T = unknown>(path: string, options?: TikTokCallOptions): Promise<TikTokResponse<T>>;
}

export type TikTokClientConfig = {
  /** TikTok Shop app key. */
  appKey: string;
  /** TikTok Shop app secret — the HMAC-SHA256 signing secret. */
  appSecret: string;
  /** API host, e.g. https://open-api.tiktokglobalshop.com (override per env for sandbox). */
  baseUrl: string;
  /** Injectable for tests; defaults to the global `fetch`. */
  fetchImpl?: typeof fetch;
  /** Injectable clock returning UNIX SECONDS; defaults to Date.now()/1000. */
  now?: () => number;
};
