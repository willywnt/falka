import { fetchShopeeOrders } from '@palka/marketplace-providers';
import type {
  ShopeeCallOptions,
  ShopeeClient,
  ShopeeOrderRecord,
} from '@palka/marketplace-providers';
import { describe, expect, it } from 'vitest';

import {
  normalizeShopeeStatus,
  toNormalizedShopeeOrder,
} from '@/modules/orders/adapters/shopee-order-adapter';

/**
 * Pins the Shopee order parser + normalizer. The load-bearing quirks (verified against the
 * Open Platform v2 docs / SDK schemas):
 *  - get_order_list returns THIN records (order_sn + order_status) with CURSOR pagination; full
 *    fields come from a second get_order_detail call (batched ≤50, optional fields requested).
 *  - the tracking number is NOT on the order detail — it comes from the LOGISTICS module
 *    (get_tracking_number) and only for shipped orders.
 *  - the identifier is order_sn (a STRING), not a numeric order id.
 */
type CallLog = { path: string; options: ShopeeCallOptions };

const LIST_PATH = '/api/v2/order/get_order_list';
const DETAIL_PATH = '/api/v2/order/get_order_detail';
const TRACKING_PATH = '/api/v2/logistics/get_tracking_number';

function ok<T>(response: T): { error: ''; raw: Record<string, unknown>; response: T } {
  return { error: '', raw: {}, response };
}

function fakeClient(
  parts: {
    list: { order_sn: string; order_status: string }[];
    details: Record<string, unknown>[];
    tracking?: Record<string, string>;
  },
  log?: CallLog[],
): ShopeeClient {
  return {
    call: (async (path: string, options: ShopeeCallOptions = {}) => {
      log?.push({ path, options });
      if (path === LIST_PATH) {
        return ok({ order_list: parts.list, more: false });
      }
      if (path === DETAIL_PATH) {
        return ok({ order_list: parts.details });
      }
      if (path === TRACKING_PATH) {
        const sn = String(options.params?.order_sn ?? '');
        return ok({ tracking_number: parts.tracking?.[sn] ?? '' });
      }
      throw new Error(`unexpected path ${path}`);
    }) as ShopeeClient['call'],
  };
}

const RANGE = { timeFrom: 1_700_000_000, timeTo: 1_700_003_600 };

describe('fetchShopeeOrders — list → detail → tracking stitching', () => {
  it('hydrates order details and fetches tracking ONLY for shipped orders', async () => {
    const log: CallLog[] = [];
    const client = fakeClient(
      {
        list: [
          { order_sn: 'SN-SHIPPED', order_status: 'SHIPPED' },
          { order_sn: 'SN-READY', order_status: 'READY_TO_SHIP' },
        ],
        details: [
          {
            order_sn: 'SN-SHIPPED',
            order_status: 'SHIPPED',
            create_time: 1_699_990_000,
            update_time: 1_700_000_500,
            buyer_username: 'budi',
            total_amount: 300000,
            currency: 'IDR',
            item_list: [
              {
                item_id: 3744623870,
                model_id: 116272301497,
                item_sku: 'TEE',
                model_sku: 'TEE-BLACK-M',
                item_name: 'Cotton Tee',
                model_quantity_purchased: 2,
                model_discounted_price: 150000,
              },
            ],
          },
          {
            order_sn: 'SN-READY',
            order_status: 'READY_TO_SHIP',
            create_time: 1_700_001_000,
            update_time: 1_700_001_000,
            buyer_username: 'sari',
            total_amount: 50000,
            currency: 'IDR',
            item_list: [
              {
                item_id: 999,
                model_id: 0,
                item_sku: 'MUG',
                item_name: 'Enamel Mug',
                model_quantity_purchased: 1,
                model_discounted_price: 50000,
              },
            ],
          },
        ],
        tracking: { 'SN-SHIPPED': 'SPXID0001' },
      },
      log,
    );

    const { records, complete } = await fetchShopeeOrders(client, {
      accessToken: 'tok',
      shopId: '123',
      ...RANGE,
    });

    expect(complete).toBe(true);
    expect(records).toHaveLength(2);

    const shipped = records.find((r) => r.orderSn === 'SN-SHIPPED')!;
    expect(shipped.status).toBe('SHIPPED');
    expect(shipped.trackingNumber).toBe('SPXID0001');
    expect(shipped.totalAmount).toBe(300000);
    expect(shipped.buyerName).toBe('budi');
    expect(shipped.lines).toHaveLength(1);
    expect(shipped.lines[0]!.itemId).toBe('3744623870');
    expect(shipped.lines[0]!.modelId).toBe('116272301497');
    expect(shipped.lines[0]!.modelSku).toBe('TEE-BLACK-M');
    expect(shipped.lines[0]!.quantity).toBe(2);
    expect(shipped.lines[0]!.unitPrice).toBe(150000);

    const ready = records.find((r) => r.orderSn === 'SN-READY')!;
    // READY_TO_SHIP has no shipping document yet → no tracking lookup, null tracking.
    expect(ready.trackingNumber).toBeNull();
    expect(ready.lines[0]!.modelId).toBe('0'); // no-variation item

    // Tracking was requested for the shipped order only.
    const trackingCalls = log.filter((entry) => entry.path === TRACKING_PATH);
    expect(trackingCalls).toHaveLength(1);
    expect(String(trackingCalls[0]!.options.params?.order_sn)).toBe('SN-SHIPPED');
  });

  it('paces every provider call via beforeCall (list page + detail batch + tracking)', async () => {
    let beforeCallCount = 0;
    const client = fakeClient({
      list: [{ order_sn: 'SN-1', order_status: 'COMPLETED' }],
      details: [{ order_sn: 'SN-1', order_status: 'COMPLETED', item_list: [] }],
      tracking: { 'SN-1': 'SPXID9' },
    });

    await fetchShopeeOrders(client, {
      accessToken: 'tok',
      shopId: '123',
      ...RANGE,
      beforeCall: async () => {
        beforeCallCount += 1;
      },
    });

    // 1 list page + 1 detail batch + 1 tracking lookup (COMPLETED order) = 3 paced calls.
    expect(beforeCallCount).toBe(3);
  });

  it('returns empty without a detail call when no orders match the window', async () => {
    const log: CallLog[] = [];
    const { records, complete } = await fetchShopeeOrders(
      fakeClient({ list: [], details: [] }, log),
      { accessToken: 'tok', shopId: '123', ...RANGE },
    );

    expect(records).toEqual([]);
    expect(complete).toBe(true);
    expect(log.some((entry) => entry.path === DETAIL_PATH)).toBe(false);
  });
});

describe('normalizeShopeeStatus — Shopee order_status → normalized', () => {
  it('reserves on paid-and-awaiting-handover statuses', () => {
    expect(normalizeShopeeStatus('READY_TO_SHIP')).toBe('PAID');
    expect(normalizeShopeeStatus('PROCESSED')).toBe('PAID');
    expect(normalizeShopeeStatus('INVOICE_PENDING')).toBe('PAID');
    // A cancel request keeps the reservation until the order is actually CANCELLED.
    expect(normalizeShopeeStatus('IN_CANCEL')).toBe('PAID');
  });

  it('consumes the reservation only once shipped', () => {
    expect(normalizeShopeeStatus('SHIPPED')).toBe('SHIPPED');
    expect(normalizeShopeeStatus('TO_CONFIRM_RECEIVE')).toBe('SHIPPED');
    expect(normalizeShopeeStatus('COMPLETED')).toBe('COMPLETED');
  });

  it('maps unpaid → PENDING, cancelled → CANCELLED, unknown → null (case-insensitive)', () => {
    expect(normalizeShopeeStatus('UNPAID')).toBe('PENDING');
    expect(normalizeShopeeStatus('cancelled')).toBe('CANCELLED');
    expect(normalizeShopeeStatus('SOME_FUTURE_STATUS')).toBeNull();
  });
});

describe('toNormalizedShopeeOrder — record → cross-provider order', () => {
  it('maps order_sn, model ids, unix-second timestamps, and falls back to PENDING on unknown', () => {
    const record: ShopeeOrderRecord = {
      orderSn: 'SN-XYZ',
      status: 'WEIRD_STATUS',
      createTime: 1_700_000_000,
      updateTime: 1_700_000_900,
      buyerName: 'andi',
      totalAmount: 99000,
      currency: 'IDR',
      trackingNumber: 'SPXID7',
      lines: [
        {
          itemId: '10',
          modelId: '20',
          modelSku: 'SKU-A',
          itemSku: 'SKU-PARENT',
          name: 'Thing',
          quantity: 3,
          unitPrice: 33000,
        },
      ],
      raw: {},
    };

    const order = toNormalizedShopeeOrder(record);
    expect(order.externalOrderId).toBe('SN-XYZ');
    expect(order.status).toBe('PENDING'); // unknown status → safe default
    expect(order.trackingNumber).toBe('SPXID7');
    expect(order.placedAt.getTime()).toBe(1_700_000_000 * 1000);
    expect(order.updatedAt?.getTime()).toBe(1_700_000_900 * 1000);
    expect(order.items[0]!.externalProductId).toBe('10');
    expect(order.items[0]!.externalVariantId).toBe('20');
    expect(order.items[0]!.externalSku).toBe('SKU-A');
  });
});
