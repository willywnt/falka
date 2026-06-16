import { buildLazadaSellableStockPayload } from '@falka/marketplace-providers';
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

  // ── Multi-warehouse (Policy A) ──────────────────────────────────────────────────────
  // A Lazada SKU can split stock across warehouses; a bare <SellableQuantity> sets only
  // ONE, so the buyer-facing Σ drifts from internal `available`. With a syncWarehouseCode,
  // push the full quantity there and zero the OTHER captured warehouses. Inner element is
  // <Quantity> (live-verified 2026-06-16 — NOT <SellableQuantity>).
  it('emits a MultiWarehouseInventories block: sync warehouse at full qty, others zeroed', () => {
    expect(
      buildLazadaSellableStockPayload({
        externalProductId: '8800780845',
        externalVariantId: '16243014036',
        quantity: 1781,
        syncWarehouseCode: 'dropshipping',
        warehouseCodes: ['dropshipping', 'ID67YE4SPX-WH-10010', 'ID67YE4SPX-WH-10013'],
      }),
    ).toBe(
      '<Request><Product><Skus><Sku>' +
        '<ItemId>8800780845</ItemId><SkuId>16243014036</SkuId>' +
        '<MultiWarehouseInventories>' +
        '<MultiWarehouseInventory><WarehouseCode>dropshipping</WarehouseCode><Quantity>1781</Quantity></MultiWarehouseInventory>' +
        '<MultiWarehouseInventory><WarehouseCode>ID67YE4SPX-WH-10010</WarehouseCode><Quantity>0</Quantity></MultiWarehouseInventory>' +
        '<MultiWarehouseInventory><WarehouseCode>ID67YE4SPX-WH-10013</WarehouseCode><Quantity>0</Quantity></MultiWarehouseInventory>' +
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
        warehouseCodes: ['dropshipping', 'ID67YE4SPX-WH-10010'],
      }),
    ).toBe(
      '<Request><Product><Skus><Sku>' +
        '<ItemId>8800780845</ItemId><SkuId>16243014036</SkuId>' +
        '<SellableQuantity>5</SellableQuantity>' +
        '</Sku></Skus></Product></Request>',
    );
  });

  it('keeps the bare path when the sync warehouse is the SKU’s only warehouse (nothing to zero)', () => {
    expect(
      buildLazadaSellableStockPayload({
        externalProductId: '8800780845',
        externalVariantId: '16243014036',
        quantity: 9,
        syncWarehouseCode: 'dropshipping',
        warehouseCodes: ['dropshipping'],
      }),
    ).toBe(
      '<Request><Product><Skus><Sku>' +
        '<ItemId>8800780845</ItemId><SkuId>16243014036</SkuId>' +
        '<SellableQuantity>9</SellableQuantity>' +
        '</Sku></Skus></Product></Request>',
    );
  });

  it('dedupes warehouseCodes and excludes the sync warehouse from the zeroed set', () => {
    const payload = buildLazadaSellableStockPayload({
      externalProductId: '1',
      externalVariantId: '2',
      quantity: 3,
      syncWarehouseCode: 'wh-main',
      warehouseCodes: ['wh-main', 'wh-a', 'wh-a', 'wh-main'],
    });
    expect(payload).toBe(
      '<Request><Product><Skus><Sku>' +
        '<ItemId>1</ItemId><SkuId>2</SkuId>' +
        '<MultiWarehouseInventories>' +
        '<MultiWarehouseInventory><WarehouseCode>wh-main</WarehouseCode><Quantity>3</Quantity></MultiWarehouseInventory>' +
        '<MultiWarehouseInventory><WarehouseCode>wh-a</WarehouseCode><Quantity>0</Quantity></MultiWarehouseInventory>' +
        '</MultiWarehouseInventories>' +
        '</Sku></Skus></Product></Request>',
    );
  });
});
