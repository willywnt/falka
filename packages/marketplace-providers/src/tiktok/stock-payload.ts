export type TikTokStockPayloadInput = {
  /** TikTok Shop sku_id — the external variant id (the product_id goes in the request PATH). */
  externalVariantId: string;
  /** Absolute quantity to set. */
  quantity: number;
  /**
   * Per-connection designated warehouse → TikTok `warehouse_id`. When set, the quantity is
   * written to ONLY this warehouse; others are OMITTED and left untouched (non-destructive, like
   * the Lazada/Shopee sync warehouse). null/undefined => a single inventory entry with no warehouse.
   */
  syncWarehouseCode?: string | null;
};

export type TikTokInventoryEntry = { warehouse_id?: string; quantity: number };

export type TikTokInventoryUpdateBody = {
  skus: Array<{ id: string; inventory: TikTokInventoryEntry[] }>;
};

/**
 * Builds the body for `POST /product/202309/products/{product_id}/inventory/update` — sets a
 * SKU's ABSOLUTE quantity (what stock sync needs). The product_id is part of the PATH (the
 * adapter supplies it), not the body. One SKU per call (the worker fans out per mapping).
 *
 * NOTE: verify the exact path + body field names against the live TikTok Shop docs (version
 * 202309) when wiring the sandbox.
 */
export function buildTikTokInventoryUpdateBody(
  input: TikTokStockPayloadInput,
): TikTokInventoryUpdateBody {
  const warehouse = input.syncWarehouseCode?.trim();
  const inventory: TikTokInventoryEntry[] = warehouse
    ? [{ warehouse_id: warehouse, quantity: input.quantity }]
    : [{ quantity: input.quantity }];

  return { skus: [{ id: input.externalVariantId, inventory }] };
}
