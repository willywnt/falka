import type { StockLedgerReason } from '@prisma/client';

export const STOCK_REASON_LABELS: Record<StockLedgerReason, string> = {
  MANUAL_ADJUST: 'Penyesuaian manual',
  RESTOCK: 'Restok',
  DAMAGE: 'Rusak',
  DAMAGE_WRITE_OFF: 'Hapus stok rusak',
  RECONCILE: 'Rekonsiliasi',
  ORDER_RESERVE: 'Pesanan dipesan',
  ORDER_RELEASE: 'Pesanan dilepas',
  ORDER_SHIP: 'Pesanan terkirim',
  RETURN: 'Retur',
  SALE: 'Penjualan offline',
  MARKETPLACE_SYNC: 'Sinkron marketplace',
};

export function stockReasonLabel(reason: StockLedgerReason): string {
  return STOCK_REASON_LABELS[reason];
}
