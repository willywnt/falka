import { describe, expect, it } from 'vitest';

import {
  extractOrderItemMedia,
  extractOrderMarketplaceMeta,
} from '@/modules/orders/utils/marketplace-meta';

describe('extractOrderMarketplaceMeta', () => {
  it('pulls the seller-relevant fields from a Lazada raw payload', () => {
    const meta = extractOrderMarketplaceMeta({
      order: {
        order_number: 4030,
        payment_method: 'Cash on Delivery',
        shipping_fee: 4500,
        promised_shipping_times: '2026-06-25T17:00:00+07:00',
        warehouse_code: 'ID67YE4SPX-WH-10013',
        is_cancel_pending: false,
        buyer_note: 'Tolong bubble wrap ya',
      },
      items: [
        {
          shipment_provider: 'Drop-off: LEX ID, Delivery: J&T',
          return_status: '',
          cancel_return_initiator: 'null-null',
        },
      ],
    });

    expect(meta.orderNumber).toBe('4030');
    expect(meta.paymentMethod).toBe('Cash on Delivery');
    expect(meta.shippingFee).toBe(4500);
    expect(meta.promisedShipTime).toBe('2026-06-25T17:00:00+07:00');
    // Courier = only the "Delivery:" part, not the drop-off prefix.
    expect(meta.courier).toBe('J&T');
    expect(meta.warehouseCode).toBe('ID67YE4SPX-WH-10013');
    expect(meta.returnStatus).toBeNull();
    expect(meta.cancelPending).toBe(false);
    expect(meta.buyerNote).toBe('Tolong bubble wrap ya');
    expect(meta.cancelReason).toBeNull();
  });

  it('extracts a marketplace cancel reason and per-item media', () => {
    const raw = {
      order: { buyer_note: '' },
      items: [
        {
          sku_id: '16145310478',
          reason: 'Out of stock',
          reason_detail: 'Seller cancelled: out of stock',
          product_main_image: 'https://img.lazcdn.com/p/abc.jpg',
          product_detail_url: 'https://www.lazada.co.id/products/i8708856468-s16145310478.html',
        },
      ],
    };

    expect(extractOrderMarketplaceMeta(raw).cancelReason).toBe('Seller cancelled: out of stock');
    expect(extractOrderMarketplaceMeta(raw).buyerNote).toBeNull();

    const media = extractOrderItemMedia(raw);
    expect(media.get('16145310478')).toEqual({
      imageUrl: 'https://img.lazcdn.com/p/abc.jpg',
      detailUrl: 'https://www.lazada.co.id/products/i8708856468-s16145310478.html',
    });
  });

  it('flags a pending cancellation and surfaces a real return status', () => {
    const meta = extractOrderMarketplaceMeta({
      order: { is_cancel_pending: true },
      items: [{ return_status: 'shipped_back' }],
    });
    expect(meta.cancelPending).toBe(true);
    expect(meta.returnStatus).toBe('shipped_back');
  });

  it('returns empty meta for the stub/demo payload (no order/items keys)', () => {
    const meta = extractOrderMarketplaceMeta({ source: 'stub', step: 1 });
    expect(meta.orderNumber).toBeNull();
    expect(meta.courier).toBeNull();
    expect(meta.cancelPending).toBe(false);
  });

  it('is null-safe for a null/garbage payload', () => {
    expect(extractOrderMarketplaceMeta(null).paymentMethod).toBeNull();
    expect(extractOrderMarketplaceMeta('nope').shippingFee).toBeNull();
  });
});
