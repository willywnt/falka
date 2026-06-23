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
};

function readString(value: unknown): string | null {
  if (typeof value === 'string') return value.trim() === '' ? null : value;
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
  // A return status / cancel initiator that any item carries (first non-empty wins).
  const returnStatus = meaningful(
    items.map((item) => readString(item.return_status)).find((value) => meaningful(value)) ?? null,
  );

  return {
    orderNumber: readString(header.order_number),
    paymentMethod: readString(header.payment_method),
    shippingFee: readNumber(header.shipping_fee),
    promisedShipTime,
    courier: readString(firstItem.shipment_provider),
    warehouseCode: readString(header.warehouse_code) ?? readString(firstItem.warehouse_code),
    returnStatus,
    cancelPending: header.is_cancel_pending === true || header.need_cancel_confirm === true,
  };
}
