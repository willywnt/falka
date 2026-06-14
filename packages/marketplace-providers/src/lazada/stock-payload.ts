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
 * LazOP `/product/price_quantity/update` payload, keyed by SellerSku when known, else
 * ItemId+SkuId. Shared by the worker stock provider and the dev verification script so the
 * payload we test is exactly the one that ships.
 */
export function buildLazadaQuantityPayload(input: LazadaStockPayloadInput): string {
  const identity = input.externalSku
    ? `<SellerSku>${escapeXml(input.externalSku)}</SellerSku>`
    : `<ItemId>${escapeXml(input.externalProductId ?? '')}</ItemId>` +
      `<SkuId>${escapeXml(input.externalVariantId ?? '')}</SkuId>`;

  return `<Request><Product><Skus><Sku>${identity}<Quantity>${input.quantity}</Quantity></Sku></Skus></Product></Request>`;
}
