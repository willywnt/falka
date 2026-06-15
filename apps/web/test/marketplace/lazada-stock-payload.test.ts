import { buildLazadaSellableStockPayload } from '@falka/marketplace-providers';
import { describe, expect, it } from 'vitest';

/**
 * Pins the LazOP /product/stock/sellable/adjust payload — the exact XML the worker ships
 * and the dev verification script sends (live-validated 2026-06-15 against a dropshipping
 * seller, where /product/price_quantity/update returns SELLER_NOT_PERMITTED). Sets the
 * ABSOLUTE sellable quantity; identify by ItemId + SkuId (+ SellerSku when known).
 */
describe('buildLazadaSellableStockPayload', () => {
  it('emits ItemId + SkuId + SellerSku + SellableQuantity when all are present', () => {
    expect(
      buildLazadaSellableStockPayload({
        externalSku: 'TEST-SKU-01',
        externalProductId: '18857564074',
        externalVariantId: '116272301497',
        quantity: 5,
      }),
    ).toBe(
      '<Request><Product><Skus><Sku>' +
        '<ItemId>18857564074</ItemId><SkuId>116272301497</SkuId>' +
        '<SellerSku>TEST-SKU-01</SellerSku><SellableQuantity>5</SellableQuantity>' +
        '</Sku></Skus></Product></Request>',
    );
  });

  it('omits SellerSku when it is not provided', () => {
    expect(
      buildLazadaSellableStockPayload({
        externalProductId: '18857564074',
        externalVariantId: '116272301497',
        quantity: 0,
      }),
    ).toBe(
      '<Request><Product><Skus><Sku>' +
        '<ItemId>18857564074</ItemId><SkuId>116272301497</SkuId>' +
        '<SellableQuantity>0</SellableQuantity>' +
        '</Sku></Skus></Product></Request>',
    );
  });

  it('falls back to SellerSku only when item/sku ids are missing', () => {
    expect(buildLazadaSellableStockPayload({ externalSku: 'TEST-SKU-01', quantity: 7 })).toBe(
      '<Request><Product><Skus><Sku>' +
        '<SellerSku>TEST-SKU-01</SellerSku><SellableQuantity>7</SellableQuantity>' +
        '</Sku></Skus></Product></Request>',
    );
  });

  it('escapes XML metacharacters in the SellerSku', () => {
    expect(buildLazadaSellableStockPayload({ externalSku: 'A&B<C>', quantity: 1 })).toContain(
      '<SellerSku>A&amp;B&lt;C&gt;</SellerSku>',
    );
  });
});
