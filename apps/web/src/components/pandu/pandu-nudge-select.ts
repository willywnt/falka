import type { Route } from 'next';

import { REORDER_DEFAULTS } from '@/modules/inventory/config';
import { formatCurrency } from '@/lib/formatters';

/**
 * Pure Pandu-nudge selection. STUB CONTRACT (jujur): every number is REAL data
 * the app already serves; only the prioritization is rule-based — no generated
 * prose, no fake intelligence. Kept React-free so the ranking is unit-testable;
 * the hook in pandu-nudges.ts just feeds it live query data.
 */

/** Priority band — drives the dock's grouped eyebrows and the sort order. */
export type NudgeGroup = 'urgent' | 'attention' | 'info';

export type PanduNudge = {
  /** Stable per-datum id — dismissal re-arms when the underlying number changes. */
  id: string;
  /** Icon/colour cue (urgent = beacon amber, info = neutral). */
  tone: 'urgent' | 'info';
  group: NudgeGroup;
  /** Tie-break within a group (lower shows first). */
  priority: number;
  text: string;
  actionLabel: string;
  href: Route;
};

export interface NudgeReorderSummary {
  readonly urgentCount: number;
  readonly deadStockCount: number;
  /** Serialized decimal (matches ReorderSummary); formatCurrency accepts the string. */
  readonly deadStockValue: string;
}

export interface NudgeTopUrgent {
  readonly productName: string;
  readonly variantName: string;
  readonly daysOfCover: number | null;
  readonly availableStock: number;
  readonly variantId: string;
}

export interface NudgeInvSummary {
  readonly oversoldCount: number;
  readonly lowStockCount: number;
}

export interface NudgeInputs {
  readonly reorderSummary?: NudgeReorderSummary;
  readonly topUrgent?: NudgeTopUrgent;
  readonly invSummary?: NudgeInvSummary;
  /** Live ops-pulse counts (undefined = query not run / no permission). */
  readonly ordersToShip?: number;
  readonly returnsPending?: number;
  readonly marketplaceUnhealthy?: number;
}

const GROUP_RANK: Record<NudgeGroup, number> = { urgent: 0, attention: 1, info: 2 };

/** Build every applicable nudge from live data, sorted by group then priority. */
export function buildNudgeCandidates(inputs: NudgeInputs): PanduNudge[] {
  const {
    reorderSummary,
    topUrgent,
    invSummary,
    ordersToShip,
    returnsPending,
    marketplaceUnhealthy,
  } = inputs;
  const candidates: PanduNudge[] = [];

  if (invSummary && invSummary.oversoldCount > 0) {
    candidates.push({
      id: `oversold:${invSummary.oversoldCount}`,
      tone: 'urgent',
      group: 'urgent',
      priority: 0,
      text: `${invSummary.oversoldCount} varian oversold — stok sistem minus. Rapikan selisihnya sebelum numpuk.`,
      actionLabel: 'Cek inventaris',
      href: '/dashboard/inventory',
    });
  }

  if (reorderSummary && reorderSummary.urgentCount > 0) {
    const days =
      topUrgent?.daysOfCover != null ? Math.max(0, Math.round(topUrgent.daysOfCover)) : null;
    const others = reorderSummary.urgentCount - 1;
    candidates.push({
      id: `reorder-urgent:${reorderSummary.urgentCount}:${topUrgent?.variantId ?? 'none'}`,
      tone: 'urgent',
      group: 'urgent',
      priority: 1,
      text: topUrgent
        ? `Stok ${topUrgent.productName} ${topUrgent.variantName} habis ${days != null ? `±${days} hari lagi` : 'sebelum restok datang'} (sisa ${topUrgent.availableStock})${others > 0 ? ` — plus ${others} varian lain` : ''}. Buatkan PO?`
        : `${reorderSummary.urgentCount} varian bakal habis sebelum restok datang. Buatkan PO?`,
      actionLabel: 'Buat PO',
      href: '/dashboard/purchasing/new',
    });
  }

  if (marketplaceUnhealthy && marketplaceUnhealthy > 0) {
    candidates.push({
      id: `marketplace-unhealthy:${marketplaceUnhealthy}`,
      tone: 'urgent',
      group: 'urgent',
      priority: 2,
      text: `${marketplaceUnhealthy} channel marketplace perlu dicek — sinkronisasi mungkin bermasalah.`,
      actionLabel: 'Cek marketplace',
      href: '/dashboard/marketplace',
    });
  }

  if (ordersToShip && ordersToShip > 0) {
    candidates.push({
      id: `orders-to-ship:${ordersToShip}`,
      tone: 'info',
      group: 'attention',
      priority: 0,
      text: `${ordersToShip} pesanan sudah dibayar dan siap dikirim.`,
      actionLabel: 'Proses pesanan',
      href: '/dashboard/orders?status=PAID' as Route,
    });
  }

  if (returnsPending && returnsPending > 0) {
    candidates.push({
      id: `returns-pending:${returnsPending}`,
      tone: 'info',
      group: 'attention',
      priority: 1,
      text: `${returnsPending} retur nunggu diproses.`,
      actionLabel: 'Proses retur',
      href: '/dashboard/returns',
    });
  }

  if (invSummary && invSummary.lowStockCount > 0) {
    candidates.push({
      id: `lowstock:${invSummary.lowStockCount}`,
      tone: 'info',
      group: 'info',
      priority: 0,
      text: `${invSummary.lowStockCount} varian menipis di bawah batas stoknya.`,
      actionLabel: 'Lihat stok',
      href: '/dashboard/inventory?status=low' as Route,
    });
  }

  if (reorderSummary && reorderSummary.deadStockCount > 0) {
    candidates.push({
      id: `deadstock:${reorderSummary.deadStockCount}:${reorderSummary.deadStockValue}`,
      tone: 'info',
      group: 'info',
      priority: 1,
      text: `${formatCurrency(reorderSummary.deadStockValue)} modal mengendap di ${reorderSummary.deadStockCount} varian tanpa penjualan ${REORDER_DEFAULTS.deadStockDays} hari.`,
      actionLabel: 'Lihat saran',
      href: '/dashboard/inventory/reorder',
    });
  }

  return candidates.sort(
    (a, b) => GROUP_RANK[a.group] - GROUP_RANK[b.group] || a.priority - b.priority,
  );
}
