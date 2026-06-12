'use client';

import { REORDER_DEFAULTS } from '@/modules/inventory/config';
import { useReorderReportQuery } from '@/modules/inventory/hooks/use-inventory';
import { useOrdersQuery } from '@/modules/orders/hooks/use-orders';
import { useReturnsQuery } from '@/modules/returns/hooks/use-returns';

import type { OpsPulseKey } from './nav-config';

/**
 * The shell's live "needs my attention" counters — paid orders waiting to
 * ship, returns waiting to be processed, variants that run out before a
 * restock lands. App-layer composition over existing module queries (the
 * count rides each list's PageMeta.total at pageSize 1; the reorder query is
 * the exact key Pandu already keeps warm, so the cache is shared).
 */
export function useOpsPulse(): Partial<Record<OpsPulseKey, number>> {
  const orders = useOrdersQuery(1, 1, { status: 'PAID' });
  const returns = useReturnsQuery('PENDING', 1, 1);
  const reorder = useReorderReportQuery({
    windowDays: REORDER_DEFAULTS.windowDays,
    leadTimeDays: REORDER_DEFAULTS.leadTimeDays,
    targetCoverDays: REORDER_DEFAULTS.targetCoverDays,
  });

  return {
    ordersToShip: orders.data?.meta.total,
    returnsPending: returns.data?.meta.total,
    restockUrgent: reorder.data?.summary.urgentCount,
  };
}
