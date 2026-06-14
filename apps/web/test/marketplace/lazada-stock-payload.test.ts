import { buildLazadaQuantityPayload } from '@falka/marketplace-providers';
import { describe, expect, it } from 'vitest';

/**
 * Pins the LazOP /product/price_quantity/update payload — the exact XML the worker ships
 * and the dev verification script sends. Keyed by SellerSku when present, else ItemId+SkuId.
 */
describe('buildLazadaQuantityPayload', () => {
  it('keys by SellerSku when present', () => {
    expect(buildLazadaQuantityPayload({ externalSku: 'TEST-SKU-01', quantity: 5 })).toBe(
      '<Request><Product><Skus><Sku><SellerSku>TEST-SKU-01</SellerSku><Quantity>5</Quantity></Sku></Skus></Product></Request>',
    );
  });

  it('falls back to ItemId + SkuId when there is no SellerSku', () => {
    expect(
      buildLazadaQuantityPayload({
        externalSku: null,
        externalProductId: '18857564074',
        externalVariantId: '116272301497',
        quantity: 0,
      }),
    ).toBe(
      '<Request><Product><Skus><Sku><ItemId>18857564074</ItemId><SkuId>116272301497</SkuId><Quantity>0</Quantity></Sku></Skus></Product></Request>',
    );
  });

  it('escapes XML metacharacters in the SKU', () => {
    expect(buildLazadaQuantityPayload({ externalSku: 'A&B<C>', quantity: 1 })).toContain(
      '<SellerSku>A&amp;B&lt;C&gt;</SellerSku>',
    );
  });
});
