import { buildTikTokInventoryUpdateBody } from '@palka/marketplace-providers';
import { describe, expect, it } from 'vitest';

/**
 * Pins the TikTok Shop inventory-update body (the Tokopedia channel). Sets a SKU's ABSOLUTE
 * quantity; the product_id is part of the request PATH, not the body. With a syncWarehouseCode
 * set, write ONLY that warehouse_id and omit the rest (non-destructive, like Lazada/Shopee).
 */
describe('buildTikTokInventoryUpdateBody', () => {
  it('emits a single sku with one inventory entry (no warehouse) by default', () => {
    expect(buildTikTokInventoryUpdateBody({ externalVariantId: 'SKU-9', quantity: 5 })).toEqual({
      skus: [{ id: 'SKU-9', inventory: [{ quantity: 5 }] }],
    });
  });

  it('targets ONLY the sync warehouse via warehouse_id when configured', () => {
    expect(
      buildTikTokInventoryUpdateBody({
        externalVariantId: 'SKU-9',
        quantity: 12,
        syncWarehouseCode: 'WH-JKT',
      }),
    ).toEqual({ skus: [{ id: 'SKU-9', inventory: [{ warehouse_id: 'WH-JKT', quantity: 12 }] }] });
  });

  it('treats a blank/whitespace syncWarehouseCode as unset (no warehouse_id)', () => {
    expect(
      buildTikTokInventoryUpdateBody({
        externalVariantId: 'SKU-9',
        quantity: 0,
        syncWarehouseCode: '   ',
      }),
    ).toEqual({ skus: [{ id: 'SKU-9', inventory: [{ quantity: 0 }] }] });
  });
});
