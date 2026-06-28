function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export type LazadaStockPayloadInput = {
  /** Seller SKU (preferred identity). */
  externalSku?: string | null;
  /** Lazada item_id — used with externalVariantId when there is no SellerSku. */
  externalProductId?: string | null;
  /** Lazada SkuId — used with externalProductId when there is no SellerSku. */
  externalVariantId?: string | null;
  quantity: number;
  /**
   * Per-connection designated "sync warehouse" (the ONE Lazada warehouse Palka owns). When
   * set, `quantity` is written to ONLY this warehouseCode via a single-entry
   * `<MultiWarehouseInventories>` block; every other warehouse of the SKU is OMITTED and left
   * untouched (Lazada partial-update, live-verified 2026-06-16). null/undefined => legacy
   * single-warehouse path (bare `<SellableQuantity>`, byte-for-byte unchanged).
   *
   * Palka never zeroes a warehouse it doesn't own (that would erase stock another writer
   * manages); we own exactly one warehouse, so the buyer-facing SKU total may legitimately
   * exceed our `available` when other warehouses hold their own stock.
   */
  syncWarehouseCode?: string | null;
};

function warehouseInventoryXml(code: string, quantity: number): string {
  // Inner element is <Quantity> (NOT <SellableQuantity>) and absolute — live-verified
  // 2026-06-16. Lazada silently ignores an unknown child element (still returns code:0),
  // so this was confirmed by a changing set + read-back, not by the envelope.
  return (
    `<MultiWarehouseInventory><WarehouseCode>${escapeXml(code)}</WarehouseCode>` +
    `<Quantity>${quantity}</Quantity></MultiWarehouseInventory>`
  );
}

/**
 * Builds the `<…>` stock element for one SKU. With a sync warehouse configured, write ONLY
 * that warehouse (single-entry `<MultiWarehouseInventories>`, others omitted = untouched);
 * otherwise the legacy bare `<SellableQuantity>` (preserves the live-validated single-warehouse
 * path byte-for-byte).
 */
function buildStockElement(input: LazadaStockPayloadInput): string {
  const syncCode = input.syncWarehouseCode?.trim();
  if (!syncCode) {
    return `<SellableQuantity>${input.quantity}</SellableQuantity>`;
  }
  return `<MultiWarehouseInventories>${warehouseInventoryXml(syncCode, input.quantity)}</MultiWarehouseInventories>`;
}

/**
 * LazOP `/product/stock/sellable/update` payload — sets a SKU's ABSOLUTE sellable
 * quantity (what stock sync needs: push the internal `available` as the new sellable
 * count). Replaces `/product/price_quantity/update`, which dropshipping-warehouse
 * sellers can't call (`SELLER_NOT_PERMITTED` / E501); this endpoint is the
 * stock-only path that works for them and never touches price. Must be POST with this
 * XML payload (simple skuId/sellableQuantity params return E006). NOTE: the sibling
 * `/product/stock/sellable/adjust` takes the SAME payload but applies it as a DELTA, so
 * the path matters — `update` = absolute set, `adjust` = increment.
 *
 * **Multi-warehouse:** a Lazada SKU can split stock across warehouses
 * (`multiWarehouseInventories[]`); a bare `<SellableQuantity>` only sets ONE (the default).
 * With a `syncWarehouseCode` configured, push the full quantity to ONLY that warehouse via a
 * single-entry `<MultiWarehouseInventories>` block and OMIT the rest — Lazada leaves omitted
 * warehouses untouched (non-destructive). Palka owns one warehouse and never zeroes the others.
 *
 * Identify by ItemId + SkuId (Lazada deprecated SellerSku for stock writes); SellerSku
 * is still included when known (Lazada's own demo carries all three) but never relied on.
 * One SKU per call (the worker fans out per mapping). Shared by the worker stock provider
 * and the dev verification script so the payload we test is exactly the one that ships.
 */
export function buildLazadaSellableStockPayload(input: LazadaStockPayloadInput): string {
  const parts: string[] = [];
  if (input.externalProductId) {
    parts.push(`<ItemId>${escapeXml(input.externalProductId)}</ItemId>`);
  }
  if (input.externalVariantId) {
    parts.push(`<SkuId>${escapeXml(input.externalVariantId)}</SkuId>`);
  }
  if (input.externalSku) {
    parts.push(`<SellerSku>${escapeXml(input.externalSku)}</SellerSku>`);
  }
  parts.push(buildStockElement(input));

  return `<Request><Product><Skus><Sku>${parts.join('')}</Sku></Skus></Product></Request>`;
}
