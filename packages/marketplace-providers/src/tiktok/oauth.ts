import { isTikTokSuccess } from './client.js';
import type { TikTokClient } from './types.js';

/**
 * TikTok Shop OAuth lifecycle (Tokopedia channel). The seller is redirected to the authorization
 * page (carrying our `service_id` + `state`); the registered callback receives a `code`, which is
 * swapped for tokens on the AUTH host. The shop_cipher needed by every shop-scoped call is then
 * resolved from `/authorization/202309/shops` (a token-scoped call, no cipher required).
 *
 * ⚠ Hosts + token field names below are the global TikTok Shop defaults; the ID "Tokopedia & Shop"
 * market may differ — VERIFY all of this against the live Partner Center docs when sandbox lands.
 * The token endpoints pass app_key/app_secret directly (NOT the request signature).
 */

const DEFAULT_AUTHORIZE_URL = 'https://services.tiktokshop.com/open/authorize';
const DEFAULT_AUTH_BASE_URL = 'https://auth.tiktok-shops.com';
const TOKEN_GET_PATH = '/api/v2/token/get';
const TOKEN_REFRESH_PATH = '/api/v2/token/refresh';
const SHOPS_PATH = '/authorization/202309/shops';

export type TikTokTokenResult = {
  accessToken: string;
  refreshToken: string;
  /** access_token lifetime in seconds (relative; normalized from TikTok's expiry field). */
  expiresIn: number;
  /** refresh_token lifetime in seconds (relative). */
  refreshExpiresIn: number;
  raw: Record<string, unknown>;
};

export type TikTokShop = {
  id: string;
  name: string;
  /** The opaque shop_cipher to send on every shop-scoped call. */
  cipher: string;
  region?: string;
};

function num(value: unknown): number {
  return typeof value === 'number' ? value : Number(value ?? 0) || 0;
}

function str(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

/**
 * TikTok returns token expiry as an ABSOLUTE unix timestamp (seconds), unlike Lazada/Shopee which
 * return a relative lifetime. Normalize to a relative lifetime so callers compute `now + expiresIn`
 * consistently: treat any value that looks like an epoch (> ~1e9) as absolute.
 */
function toRelativeSeconds(value: number, nowSeconds: number): number {
  if (value <= 0) return 0;
  return value > 1_000_000_000 ? Math.max(0, value - nowSeconds) : value;
}

function parseTokenResponse(raw: Record<string, unknown>): TikTokTokenResult {
  const data = (raw.data ?? raw) as Record<string, unknown>;
  const nowSeconds = Math.floor(Date.now() / 1000);
  return {
    accessToken: str(data.access_token) ?? '',
    refreshToken: str(data.refresh_token) ?? '',
    expiresIn: toRelativeSeconds(num(data.access_token_expire_in), nowSeconds),
    refreshExpiresIn: toRelativeSeconds(num(data.refresh_token_expire_in), nowSeconds),
    raw,
  };
}

type TokenConfig = {
  appKey: string;
  appSecret: string;
  /** AUTH host override (sandbox); defaults to the global TikTok Shop auth host. */
  authBaseUrl?: string;
  fetchImpl?: typeof fetch;
};

async function callTokenEndpoint(
  config: TokenConfig,
  path: string,
  params: Record<string, string>,
): Promise<TikTokTokenResult> {
  const fetchImpl = config.fetchImpl ?? fetch;
  const query = new URLSearchParams({
    app_key: config.appKey,
    app_secret: config.appSecret,
    ...params,
  });
  const url = `${config.authBaseUrl ?? DEFAULT_AUTH_BASE_URL}${path}?${query.toString()}`;
  const response = await fetchImpl(url, { method: 'GET' });
  const raw = (await response.json()) as Record<string, unknown>;
  const code = typeof raw.code === 'number' ? raw.code : Number(raw.code ?? -1);
  if (code !== 0) {
    const message = str(raw.message);
    throw new Error(`TikTok token call failed (code ${code}${message ? `: ${message}` : ''}).`);
  }
  return parseTokenResponse(raw);
}

/** Build the seller-authorization URL (state round-trips org + actor). */
export function buildTikTokAuthUrl(input: {
  serviceId: string;
  state: string;
  authorizeUrl?: string;
}): string {
  const query = new URLSearchParams({ service_id: input.serviceId, state: input.state });
  return `${input.authorizeUrl ?? DEFAULT_AUTHORIZE_URL}?${query.toString()}`;
}

/** Swap the authorization `code` for an access_token + refresh_token. */
export function exchangeTikTokCode(
  config: TokenConfig & { code: string },
): Promise<TikTokTokenResult> {
  return callTokenEndpoint(config, TOKEN_GET_PATH, {
    auth_code: config.code,
    grant_type: 'authorized_code',
  });
}

/** Trade a refresh_token for a fresh access_token (TikTok rotates the refresh_token). */
export function refreshTikTokToken(
  config: TokenConfig & { refreshToken: string },
): Promise<TikTokTokenResult> {
  return callTokenEndpoint(config, TOKEN_REFRESH_PATH, {
    refresh_token: config.refreshToken,
    grant_type: 'refresh_token',
  });
}

type ShopsData = {
  shops?: { id?: string; name?: string; cipher?: string; region?: string }[];
};

/**
 * Resolves the seller's authorized shops (incl. the shop_cipher each call needs). Token-scoped —
 * uses the signed client WITHOUT a shop_cipher. Called once at onboarding to persist the cipher.
 */
export async function fetchTikTokShops(
  client: TikTokClient,
  params: { accessToken: string },
): Promise<TikTokShop[]> {
  const response = await client.call<ShopsData>(SHOPS_PATH, {
    method: 'GET',
    accessToken: params.accessToken,
  });
  if (!isTikTokSuccess(response)) {
    throw new Error(
      `TikTok shops lookup failed (code ${response.code}${
        response.message ? `: ${response.message}` : ''
      }).`,
    );
  }
  return (response.data?.shops ?? []).flatMap((shop) => {
    const id = str(shop.id);
    const cipher = str(shop.cipher);
    return id && cipher
      ? [{ id, name: str(shop.name) ?? id, cipher, region: str(shop.region) }]
      : [];
  });
}
