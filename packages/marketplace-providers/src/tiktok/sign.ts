import { createHmac } from 'node:crypto';

import type { TikTokQueryParams } from './types.js';

/**
 * Builds the TikTok Shop Open API signature base string.
 *
 * Algorithm (partner.tiktokshop.com, "Signature"):
 *   1. take all query params EXCEPT `sign` and `access_token`
 *   2. sort them by key (ASCII asc) and concatenate `${key}${value}` (no separators)
 *   3. prepend the request path: `path + concatenation`
 *   4. append the raw JSON request body when present (application/json)
 *   5. wrap the whole thing with the app secret on BOTH ends:
 *        `app_secret + (path + params + body) + app_secret`
 *   6. HMAC-SHA256(app_secret, wrapped) as lower-case hex
 *
 * `path` is the path only (e.g. `/product/202309/products/search`), no query string.
 */
export function buildTikTokSignBase(input: {
  appSecret: string;
  path: string;
  query: TikTokQueryParams;
  body?: string;
}): string {
  const concatenated = Object.entries(input.query)
    .filter(([key, value]) => key !== 'sign' && key !== 'access_token' && value !== undefined)
    .map(([key, value]) => [key, String(value)] as const)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .reduce((acc, [key, value]) => `${acc}${key}${value}`, '');

  return `${input.appSecret}${input.path}${concatenated}${input.body ?? ''}${input.appSecret}`;
}

/** Signs a TikTok Shop request: HMAC-SHA256(app_secret, baseString) as lower-case hex. */
export function signTikTokRequest(input: {
  appSecret: string;
  path: string;
  query: TikTokQueryParams;
  body?: string;
}): string {
  return createHmac('sha256', input.appSecret)
    .update(buildTikTokSignBase(input), 'utf8')
    .digest('hex');
}
