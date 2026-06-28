import { buildLazadaSellableStockPayload } from '@palka/marketplace-providers';
import { describe, expect, it } from 'vitest';

/**
 * Pins the LazOP /product/stock/sellable/update payload — the exact XML the worker ships
 * and the dev verification script sends (live-validated 2026-06-15 against a dropshipping
 * seller, where /product/price_quantity/update returns SELLER_NOT_PERMITTED). POST + this
 * XML sets the ABSOLUTE sellable quantity (the /adjust sibling takes the same XML but as a
 * DELTA). Identify by ItemId + SkuId (+ SellerSku when known).
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

  // ── Multi-warehouse (non-destructive sync warehouse) ────────────────────────────────
  // A Lazada SKU can split stock across warehouses. Palka owns exactly ONE designated
  // warehouse: with a syncWarehouseCode set, write ONLY that warehouse and OMIT the rest —
  // Lazada leaves omitted warehouses untouched (partial update, live-verified 2026-06-16).
  // We never zero a warehouse we don't own. Inner element is <Quantity> (NOT <SellableQuantity>).
  it('writes ONLY the sync warehouse (single-entry block) and omits all others', () => {
    expect(
      buildLazadaSellableStockPayload({
        externalProductId: '8800780845',
        externalVariantId: '16243014036',
        quantity: 1781,
        syncWarehouseCode: 'dropshipping',
      }),
    ).toBe(
      '<Request><Product><Skus><Sku>' +
        '<ItemId>8800780845</ItemId><SkuId>16243014036</SkuId>' +
        '<MultiWarehouseInventories>' +
        '<MultiWarehouseInventory><WarehouseCode>dropshipping</WarehouseCode><Quantity>1781</Quantity></MultiWarehouseInventory>' +
        '</MultiWarehouseInventories>' +
        '</Sku></Skus></Product></Request>',
    );
  });

  it('keeps the bare <SellableQuantity> path when no syncWarehouseCode is set', () => {
    expect(
      buildLazadaSellableStockPayload({
        externalProductId: '8800780845',
        externalVariantId: '16243014036',
        quantity: 5,
      }),
    ).toBe(
      '<Request><Product><Skus><Sku>' +
        '<ItemId>8800780845</ItemId><SkuId>16243014036</SkuId>' +
        '<SellableQuantity>5</SellableQuantity>' +
        '</Sku></Skus></Product></Request>',
    );
  });

  it('treats a blank/whitespace syncWarehouseCode as unset (bare path)', () => {
    expect(
      buildLazadaSellableStockPayload({
        externalProductId: '1',
        externalVariantId: '2',
        quantity: 7,
        syncWarehouseCode: '   ',
      }),
    ).toBe(
      '<Request><Product><Skus><Sku>' +
        '<ItemId>1</ItemId><SkuId>2</SkuId>' +
        '<SellableQuantity>7</SellableQuantity>' +
        '</Sku></Skus></Product></Request>',
    );
  });

  it('escapes XML metacharacters in the sync warehouse code', () => {
    expect(
      buildLazadaSellableStockPayload({
        externalProductId: '1',
        externalVariantId: '2',
        quantity: 3,
        syncWarehouseCode: 'A&B',
      }),
    ).toContain('<WarehouseCode>A&amp;B</WarehouseCode>');
  });
});
