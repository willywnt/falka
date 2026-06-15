/**
 * Push a SKU's ABSOLUTE sellable quantity to Lazada via /product/stock/sellable/adjust —
 * the same payload the worker ships (buildLazadaSellableStockPayload). This is the
 * stock-only write path that dropshipping-warehouse sellers can use (the old
 * /product/price_quantity/update returns SELLER_NOT_PERMITTED for them). Verifies the
 * outbound write in isolation (no Redis/worker). WARNING: this changes REAL stock on
 * Lazada — use a throwaway SKU, or set a SKU to its CURRENT value for a safe no-op probe.
 *
 * Usage (builds the provider package first):
 *   pnpm lazada:stock <access_token> <item_id> <sku_id> <quantity> [seller_sku]
 *
 * (item_id + sku_id come from the import dump / `pnpm lazada:products`.) The call is a POST
 * — Lazada returns UnsupportedHTTPMethod for a GET on this path.
 * Reads LAZADA_APP_KEY / LAZADA_APP_SECRET / LAZADA_API_BASE_URL from .env or apps/web/.env.local.
 */
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  buildLazadaSellableStockPayload,
  createLazadaClient,
  isLazadaSuccess,
} from '../packages/marketplace-providers/dist/index.js';

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

const [accessToken, itemId, skuId, quantityArg, sellerSku] = process.argv.slice(2);
const quantity = Number(quantityArg);

if (!appKey || !appSecret) {
  console.error(
    'Missing LAZADA_APP_KEY / LAZADA_APP_SECRET. Set them in .env or apps/web/.env.local.',
  );
  process.exit(1);
}
if (!accessToken || !itemId || !skuId || !Number.isFinite(quantity)) {
  console.error(
    'Usage:\n  pnpm lazada:stock <access_token> <item_id> <sku_id> <quantity> [seller_sku]',
  );
  process.exit(1);
}

const client = createLazadaClient({ appKey, appSecret, baseUrl });
const payload = buildLazadaSellableStockPayload({
  externalProductId: itemId,
  externalVariantId: skuId,
  externalSku: sellerSku ?? null,
  quantity,
});

console.log(
  `Setting SellableQuantity=${quantity} on ItemId=${itemId} SkuId=${skuId} via /product/stock/sellable/adjust (POST)`,
);
console.log(`payload: ${payload}`);

const res = await client.call('/product/stock/sellable/adjust', {
  method: 'POST',
  accessToken,
  params: { payload },
});

console.log('\nEnvelope:');
console.log(`  code: ${res.code}  type: ${res.type ?? '-'}  message: ${res.message ?? '-'}`);
console.log(`  requestId: ${res.requestId ?? '-'}`);
console.log('\n--- raw response ---');
console.log(JSON.stringify(res.raw, null, 2));

if (isLazadaSuccess(res)) {
  console.log(
    `\n✅ Accepted. Check SkuId ${skuId} in Lazada Seller Center — sellable should read ${quantity}.`,
  );
} else {
  console.log('\n❌ Rejected — paste this whole output.');
  process.exitCode = 1;
}
