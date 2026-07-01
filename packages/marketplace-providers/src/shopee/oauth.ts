import { createShopeeClient } from './client.js';
import { signShopeeRequest } from './sign.js';

/**
 * Shopee OAuth token lifecycle. The shop-authorization redirect is built with
 * {@link buildShopeeAuthUrl}; the returned `code` (+ `shop_id`) is swapped for tokens via
 * `/api/v2/auth/token/get`, and refreshed via `/api/v2/auth/access_token/get`. Both token
 * calls are PUBLIC (signature base = partner_id + path + timestamp; no access_token/shop_id
 * in the sign) — `shop_id`/`partner_id` travel in the JSON BODY, not the signature. The token
 * fields sit at the TOP LEVEL of the JSON (siblings of `error`), so we read from `response.raw`.
 *
 * ⚠ Shopee access tokens are SHORT-LIVED — the real TTL is whatever `expire_in` returns (docs say
 * ~4h/14400s, but the sandbox has been observed to expire MUCH sooner than its recorded expiry, so
 * never assume the stored value is exact); the refresh token lasts ~30 days. The sync engine both
 * PROACTIVELY refreshes before use and REACTIVELY refreshes-and-retries on an INVALID_TOKEN
 * rejection, so a too-long recorded expiry self-heals instead of failing until a manual re-auth.
 */

const SHOP_AUTH_PATH = '/api/v2/shop/auth_partner';
const TOKEN_GET_PATH = '/api/v2/auth/token/get';
const ACCESS_TOKEN_GET_PATH = '/api/v2/auth/access_token/get';

export type ShopeeTokenResult = {
  accessToken: string;
  refreshToken: string;
  /** access_token lifetime in seconds (~4 hours). */
  expiresIn: number;
  /** Shop ids the token is authorized for (Shopee returns `shop_id_list`). */
  shopIdList: string[];
  raw: Record<string, unknown>;
};

type TokenConfig = {
  partnerId: string;
  partnerKey: string;
  baseUrl: string;
  fetchImpl?: typeof fetch;
  now?: () => number;
};

function num(value: unknown): number {
  return typeof value === 'number' ? value : Number(value ?? 0) || 0;
}

function str(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function parseTokenResponse(raw: Record<string, unknown>): ShopeeTokenResult {
  const shopIdList = Array.isArray(raw.shop_id_list)
    ? raw.shop_id_list.map((id) => String(id))
    : [];

  return {
    accessToken: str(raw.access_token) ?? '',
    refreshToken: str(raw.refresh_token) ?? '',
    expiresIn: num(raw.expire_in),
    shopIdList,
    raw,
  };
}

function assertOk(error: string, message: string | undefined, action: string): void {
  if (error !== '') {
    throw new Error(`Shopee ${action} failed (${error}${message ? `: ${message}` : ''}).`);
  }
}

/**
 * Builds the shop-authorization URL the seller is redirected to. `redirect` is the
 * full callback URL (Shopee appends `?code=…&shop_id=…`); carry any app state inside it.
 * The link is valid for ~5 minutes (the timestamp it signs expires).
 */
export function buildShopeeAuthUrl(input: {
  baseUrl: string;
  partnerId: string;
  partnerKey: string;
  redirect: string;
  now?: () => number;
}): string {
  const timestamp = (input.now ?? (() => Math.floor(Date.now() / 1000)))();
  const sign = signShopeeRequest({
    partnerId: input.partnerId,
    partnerKey: input.partnerKey,
    apiPath: SHOP_AUTH_PATH,
    timestamp,
  });
  const query = new URLSearchParams({
    partner_id: input.partnerId,
    timestamp: String(timestamp),
    sign,
    redirect: input.redirect,
  });
  return `${input.baseUrl}${SHOP_AUTH_PATH}?${query.toString()}`;
}

/** Swap the authorization `code` (+ `shop_id`) for an access_token + refresh_token. */
export async function exchangeShopeeCode(
  config: TokenConfig & { code: string; shopId: string },
): Promise<ShopeeTokenResult> {
  const client = createShopeeClient(config);
  const response = await client.call(TOKEN_GET_PATH, {
    method: 'POST',
    params: {
      code: config.code,
      shop_id: num(config.shopId),
      partner_id: num(config.partnerId),
    },
  });
  assertOk(response.error, response.message, 'token exchange');
  return parseTokenResponse(response.raw);
}

/** Trade a refresh_token for a fresh access_token (Shopee also rotates the refresh_token). */
export async function refreshShopeeToken(
  config: TokenConfig & { refreshToken: string; shopId: string },
): Promise<ShopeeTokenResult> {
  const client = createShopeeClient(config);
  const response = await client.call(ACCESS_TOKEN_GET_PATH, {
    method: 'POST',
    params: {
      refresh_token: config.refreshToken,
      shop_id: num(config.shopId),
      partner_id: num(config.partnerId),
    },
  });
  assertOk(response.error, response.message, 'token refresh');
  return parseTokenResponse(response.raw);
}
