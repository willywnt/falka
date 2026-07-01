import type { OrderMarketplaceMeta } from '../types';

const EMPTY_META: OrderMarketplaceMeta = {
  orderNumber: null,
  paymentMethod: null,
  shippingFee: null,
  promisedShipTime: null,
  courier: null,
  warehouseCode: null,
  returnStatus: null,
  cancelPending: false,
  buyerNote: null,
  cancelReason: null,
};

function readString(value: unknown): string | null {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed === '' ? null : trimmed;
  }
  if (typeof value === 'number') return String(value);
  return null;
}

function readNumber(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

/** Lazada placeholders like "null-null" / "null" mean "no value" — collapse them to null. */
function meaningful(value: string | null): string | null {
  if (!value) return null;
  return /^(null)([-_]null)*$/i.test(value.trim()) ? null : value;
}

/**
 * Lazada packs the fulfilment route into shipment_provider as "Drop-off: <pickup>, Delivery:
 * <courier>". The seller cares about the delivery courier, so return only that part (the
 * value after "Delivery:"); fall back to the whole string when it isn't in that shape.
 */
function parseCourier(value: string | null): string | null {
  if (!value) return null;
  const tail = /Delivery:\s*(.+)$/i.exec(value)?.[1]?.trim();
  return (tail && tail.length > 0 ? tail : value.trim()) || null;
}

/**
 * Best-effort extraction of marketplace-specific order metadata from the stored raw payload —
 * the fields a seller wants per status (SLA, courier, payment, cancellation), surfaced without
 * a schema change. Lazada-shaped (`{ order, items }`); returns empty meta for the stub/demo
 * payload or any provider that doesn't carry these keys, so it's always safe to call.
 */
export function extractOrderMarketplaceMeta(rawPayload: unknown): OrderMarketplaceMeta {
  if (!rawPayload || typeof rawPayload !== 'object') return EMPTY_META;
  const raw = rawPayload as Record<string, unknown>;
  const header = (raw.order ?? {}) as Record<string, unknown>;
  const items = Array.isArray(raw.items) ? (raw.items as Record<string, unknown>[]) : [];
  const firstItem = items[0] ?? {};

  // The SLA lives on the header (`promised_shipping_times`) or per item (`promised_shipping_time`).
  const promisedShipTime =
    readString(header.promised_shipping_times) ?? readString(firstItem.promised_shipping_time);
  // A return status that any item carries (first non-empty wins).
  const returnStatus = meaningful(
    items.map((item) => readString(item.return_status)).find((value) => meaningful(value)) ?? null,
  );
  // A cancellation reason any item carries (reason_detail is the fuller text; first non-empty wins).
  const cancelReason = meaningful(
    items
      .map((item) => readString(item.reason_detail) ?? readString(item.reason))
      .find((value) => meaningful(value)) ?? null,
  );

  return {
    orderNumber: readString(header.order_number),
    paymentMethod: readString(header.payment_method),
    shippingFee: readNumber(header.shipping_fee),
    promisedShipTime,
    courier: parseCourier(readString(firstItem.shipment_provider)),
    warehouseCode: readString(header.warehouse_code) ?? readString(firstItem.warehouse_code),
    returnStatus,
    cancelPending: header.is_cancel_pending === true || header.need_cancel_confirm === true,
    buyerNote: readString(header.buyer_note) ?? readString(header.remarks),
    cancelReason,
  };
}

/**
 * Per-line media (marketplace product photo + storefront URL) so the order detail can show each
 * line's photo and link out. Keyed by whatever id the caller looks up with — the external variant
 * id (Lazada) OR the external product id (Shopee, whose no-variation model_id is a non-unique "0").
 * `shopId` builds the Shopee storefront URL (its payload carries the image but not the link).
 * Best-effort: empty for the stub/demo payload or any provider that doesn't carry these keys.
 */
export function extractOrderItemMedia(
  rawPayload: unknown,
  shopId?: string | null,
): Map<string, { imageUrl: string | null; detailUrl: string | null }> {
  const media = new Map<string, { imageUrl: string | null; detailUrl: string | null }>();
  if (!rawPayload || typeof rawPayload !== 'object') return media;
  const raw = rawPayload as Record<string, unknown>;

  // Shopee get_order_detail: `item_list[].image_info.image_url`; the storefront URL isn't in the
  // payload, so build it from the connection's shop_id + item_id. Keyed by item_id (the order's
  // externalProductId) — model_id is "0" for a no-variation item, NOT unique across lines.
  const shopeeItems = Array.isArray(raw.item_list)
    ? (raw.item_list as Record<string, unknown>[])
    : [];
  for (const item of shopeeItems) {
    const itemId = readString(item.item_id);
    if (!itemId) continue;
    const imageInfo = (item.image_info ?? {}) as Record<string, unknown>;
    const entry = {
      imageUrl: readString(imageInfo.image_url),
      detailUrl: shopId ? `https://shopee.co.id/product/${shopId}/${itemId}` : null,
    };
    if (!media.has(itemId)) media.set(itemId, entry);
  }

  // Lazada: `items[].product_main_image` + `product_detail_url`, keyed by every id the adapter might
  // have chosen as externalVariantId (sku_id → shop_sku → sku) so the lookup hits even when omitted.
  const lazadaItems = Array.isArray(raw.items) ? (raw.items as Record<string, unknown>[]) : [];
  for (const item of lazadaItems) {
    const entry = {
      imageUrl: readString(item.product_main_image),
      detailUrl: readString(item.product_detail_url),
    };
    for (const key of [readString(item.sku_id), readString(item.shop_sku), readString(item.sku)]) {
      if (key && !media.has(key)) media.set(key, entry);
    }
  }
  return media;
}
