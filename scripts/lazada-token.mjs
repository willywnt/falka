/**
 * Exchange a Lazada authorization code for an access_token + refresh_token.
 *
 * Flow: open the authorize URL in a browser, log in + consent as the seller, then copy
 * the `code` query param from the URL Lazada redirects you to (it is single-use and
 * valid ~30 minutes). Run this to print the tokens, then paste the access_token into the
 * "Tambah marketplace" modal to create the LAZADA connection.
 *
 * Usage:
 *   pnpm --filter @falka/marketplace-providers build
 *   node scripts/lazada-token.mjs <authorization_code>
 *   node scripts/lazada-token.mjs --refresh <refresh_token>
 *
 * Reads LAZADA_APP_KEY / LAZADA_APP_SECRET / LAZADA_API_BASE_URL from .env or apps/web/.env.local.
 */
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { exchangeLazadaCode, refreshLazadaToken } from '@falka/marketplace-providers';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function loadEnvFiles() {
  for (const file of [join(root, '.env'), join(root, 'apps/web/.env.local')]) {
    if (!existsSync(file)) continue;
    for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
      const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
      if (!match) continue;
      const [, key, rawValue] = match;
      if (process.env[key] !== undefined) continue;
      process.env[key] = rawValue.replace(/^["']|["']$/g, '');
    }
  }
}

loadEnvFiles();

const appKey = process.env.LAZADA_APP_KEY;
const appSecret = process.env.LAZADA_APP_SECRET;
const baseUrl = process.env.LAZADA_API_BASE_URL ?? 'https://api.lazada.co.id/rest';

if (!appKey || !appSecret) {
  console.error(
    'Missing LAZADA_APP_KEY / LAZADA_APP_SECRET. Set them in .env or apps/web/.env.local.',
  );
  process.exit(1);
}

const isRefresh = process.argv[2] === '--refresh';
const value = isRefresh ? process.argv[3] : process.argv[2];

if (!value) {
  console.error(
    isRefresh
      ? 'Usage: node scripts/lazada-token.mjs --refresh <refresh_token>'
      : 'Usage: node scripts/lazada-token.mjs <authorization_code>',
  );
  process.exit(1);
}

const result = isRefresh
  ? await refreshLazadaToken({ appKey, appSecret, baseUrl, refreshToken: value })
  : await exchangeLazadaCode({ appKey, appSecret, baseUrl, code: value });

const expiresAt = new Date(Date.now() + result.expiresIn * 1000).toISOString();

console.log(`\n✅ ${isRefresh ? 'Refreshed' : 'Exchanged'} successfully.\n`);
console.log(`access_token:      ${result.accessToken}`);
console.log(`refresh_token:     ${result.refreshToken}`);
console.log(`expires_in:        ${result.expiresIn}s  (access token expires ~ ${expiresAt})`);
console.log(`refresh_expires_in:${result.refreshExpiresIn}s`);
console.log(`account:           ${result.account ?? '-'}`);
console.log(`country:           ${result.country ?? '-'}`);
if (result.countryUserInfo.length > 0) {
  console.log('country_user_info:');
  for (const cu of result.countryUserInfo) {
    console.log(`  - country=${cu.country} seller_id=${cu.seller_id} short_code=${cu.short_code}`);
  }
}
console.log(
  '\nNext: in "Tambah marketplace" pick LAZADA, shopId = seller_id (or short_code), paste the access_token,',
);
console.log('and set expiresAt to the value above. Then run an import to verify field shapes.');
