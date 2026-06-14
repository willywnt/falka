import type { SalePaymentMethod } from '@prisma/client';

import type { PaymentMixRow } from '../types';
import { money, round2 } from './metrics';

export type PaymentMixInput = {
  method: SalePaymentMethod;
  /** Gross total received via this method over the range. */
  amount: number;
  salesCount: number;
};

/**
 * Turns per-method POS receipt totals into the report rows: each method's share
 * of the period's total receipts, highest amount first. Pure — the server feeds
 * it a `groupBy(paymentMethod)` over realized POS sales.
 */
export function computePaymentMix(rows: PaymentMixInput[]): PaymentMixRow[] {
  const total = rows.reduce((sum, row) => sum + row.amount, 0);

  return rows
    .map((row) => ({
      method: row.method,
      amount: money(row.amount),
      salesCount: row.salesCount,
      sharePct: total > 0 ? round2((row.amount / total) * 100) : null,
    }))
    .sort((a, b) => Number(b.amount) - Number(a.amount));
}
