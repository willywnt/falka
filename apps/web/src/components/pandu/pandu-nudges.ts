'use client';

import { useOpsPulse } from '@/components/layout/use-ops-pulse';
import { REORDER_DEFAULTS } from '@/modules/inventory/config';
import {
  useInventoryDashboardQuery,
  useReorderReportQuery,
} from '@/modules/inventory/hooks/use-inventory';
import { usePanduStore } from '@/store/pandu-store';

import { buildNudgeCandidates, type PanduNudge } from './pandu-nudge-select';

export type { PanduNudge, NudgeGroup } from './pandu-nudge-select';

/**
 * Live Pandu nudges: feed the pure selector (pandu-nudge-select) the numbers the
 * app already serves — the inventory dashboard, the reorder report, and the
 * shell's ops-pulse counters (paid orders, pending returns, unhealthy channels;
 * the marketplace count is RBAC-gated and simply absent for users who can't see
 * it). Dismiss-filter and cap happen here; the ranking lives in the selector.
 */

const MAX_NUDGES = 4;

export function usePanduNudges(): {
  nudges: PanduNudge[];
  hasUrgent: boolean;
  isLoading: boolean;
  isError: boolean;
  dismissNudge: (id: string) => void;
} {
  const dashboard = useInventoryDashboardQuery();
  const reorder = useReorderReportQuery({
    windowDays: REORDER_DEFAULTS.windowDays,
    leadTimeDays: REORDER_DEFAULTS.leadTimeDays,
    targetCoverDays: REORDER_DEFAULTS.targetCoverDays,
  });
  const pulse = useOpsPulse();
  const dismissedNudgeIds = usePanduStore((state) => state.dismissedNudgeIds);
  const dismissNudge = usePanduStore((state) => state.dismissNudge);

  const reorderSummary = reorder.data?.summary;
  const invSummary = dashboard.data?.summary;
  const topUrgent = reorder.data?.items.find((item) => item.status === 'URGENT');

  const candidates = buildNudgeCandidates({
    reorderSummary,
    topUrgent: topUrgent
      ? {
          productName: topUrgent.productName,
          variantName: topUrgent.variantName,
          daysOfCover: topUrgent.daysOfCover,
          availableStock: topUrgent.availableStock,
          variantId: topUrgent.variantId,
        }
      : undefined,
    invSummary: invSummary
      ? { oversoldCount: invSummary.oversoldCount, lowStockCount: invSummary.lowStockCount }
      : undefined,
    ordersToShip: pulse.ordersToShip,
    returnsPending: pulse.returnsPending,
    marketplaceUnhealthy: pulse.marketplaceUnhealthy,
  });

  const nudges = candidates.filter((n) => !dismissedNudgeIds.includes(n.id)).slice(0, MAX_NUDGES);

  return {
    nudges,
    hasUrgent: nudges.some((n) => n.group === 'urgent'),
    isLoading: dashboard.isLoading || reorder.isLoading,
    isError: Boolean(dashboard.error ?? reorder.error),
    dismissNudge,
  };
}
