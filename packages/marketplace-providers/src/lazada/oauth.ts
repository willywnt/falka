import { createLazadaClient, isLazadaSuccess } from './client.js';
import type { LazadaResponse } from './types.js';

/**
 * Lazada OAuth token lifecycle (code-grant + refresh). These are signed REST calls on the
 * gateway — `/auth/token/create` and `/auth/token/refresh` — that carry NO access_token
 * (the signer already covers the no-token case). The token fields sit at the TOP LEVEL of
 * the envelope (siblings of `code`), not under `data`, so we read from `response.raw`.
 *
 * Region note: auth calls work on any region gateway; pass the seller's regional baseUrl
 * (e.g. https://api.lazada.co.id/rest) — the response's `country` tells you which gateway
 * the resulting access_token is bound to for subsequent business calls.
 */

export type LazadaCountryUser = {
  country?: string;
  user_id?: string;
  seller_id?: string;
  short_code?: string;
};

export type LazadaTokenResult = {
  accessToken: string;
  refreshToken: string;
  /** access_token lifetime in seconds (~30 days). */
  expiresIn: number;
  /** refresh_token lifetime in seconds (~180 days). */
  refreshExpiresIn: number;
  account?: string;
  country?: string;
  countryUserInfo: LazadaCountryUser[];
  raw: Record<string, unknown>;
};

type TokenConfig = {
  appKey: string;
  appSecret: string;
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

function parseTokenResponse(response: LazadaResponse): LazadaTokenResult {
  const raw = response.raw;
  const countryUserInfo = Array.isArray(raw.country_user_info)
    ? (raw.country_user_info as LazadaCountryUser[])
    : [];

  return {
    accessToken: str(raw.access_token) ?? '',
    refreshToken: str(raw.refresh_token) ?? '',
    expiresIn: num(raw.expires_in),
    refreshExpiresIn: num(raw.refresh_expires_in),
    account: str(raw.account),
    country: str(raw.country) ?? countryUserInfo[0]?.country,
    countryUserInfo,
    raw,
  };
}

function assertOk(response: LazadaResponse, action: string): void {
  if (!isLazadaSuccess(response)) {
    throw new Error(
      `Lazada ${action} failed (code ${response.code}${
        response.message ? `: ${response.message}` : ''
      }).`,
    );
  }
}

/** Swap a single-use authorization `code` for an access_token + refresh_token. */
export async function exchangeLazadaCode(
  config: TokenConfig & { code: string },
): Promise<LazadaTokenResult> {
  const client = createLazadaClient(config);
  const response = await client.call('/auth/token/create', {
    method: 'POST',
    params: { code: config.code },
  });
  assertOk(response, 'token exchange');
  return parseTokenResponse(response);
}

/** Trade a refresh_token for a fresh access_token (and usually a rotated refresh_token). */
export async function refreshLazadaToken(
  config: TokenConfig & { refreshToken: string },
): Promise<LazadaTokenResult> {
  const client = createLazadaClient(config);
  const response = await client.call('/auth/token/refresh', {
    method: 'POST',
    params: { refresh_token: config.refreshToken },
  });
  assertOk(response, 'token refresh');
  return parseTokenResponse(response);
}
