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
};

/**
 * LazOP `/product/stock/sellable/adjust` payload — sets a SKU's ABSOLUTE sellable
 * quantity (what stock sync needs: push the internal `available` as the new sellable
 * count). Replaces `/product/price_quantity/update`, which dropshipping-warehouse
 * sellers can't call (`SELLER_NOT_PERMITTED` / E501); this endpoint is the
 * stock-only path that works for them and never touches price.
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
  parts.push(`<SellableQuantity>${input.quantity}</SellableQuantity>`);

  return `<Request><Product><Skus><Sku>${parts.join('')}</Sku></Skus></Product></Request>`;
}
