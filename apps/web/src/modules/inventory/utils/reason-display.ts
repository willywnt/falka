import type { StockLedgerReason } from '@prisma/client';

export const STOCK_REASON_LABELS: Record<StockLedgerReason, string> = {
  MANUAL_ADJUST: 'Penyesuaian manual',
  RESTOCK: 'Restok',
  DAMAGE: 'Rusak',
  DAMAGE_WRITE_OFF: 'Hapus stok rusak',
  RECONCILE: 'Rekonsiliasi',
  ORDER_RESERVE: 'Stok dipesan',
  ORDER_RELEASE: 'Stok dilepas',
  ORDER_SHIP: 'Pesanan dikirim',
  RETURN: 'Retur',
  SALE: 'Penjualan',
  MARKETPLACE_SYNC: 'Sinkronisasi marketplace',
};

export function stockReasonLabel(reason: StockLedgerReason): string {
  return STOCK_REASON_LABELS[reason];
}
