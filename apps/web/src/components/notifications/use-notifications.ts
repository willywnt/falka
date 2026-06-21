'use client';

import type { Route } from 'next';

import { REORDER_DEFAULTS } from '@/modules/inventory/config';
import {
  useInventoryDashboardQuery,
  useReorderReportQuery,
} from '@/modules/inventory/hooks/use-inventory';
import { useMarketplaceHealthQuery } from '@/modules/marketplace/hooks/use-marketplace-health';
import {
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
  useNotificationsQuery,
} from '@/modules/notifications/hooks/use-notifications-data';
import { severityToTone } from '@/modules/notifications/notification-meta';
import type { NotificationListItem } from '@/modules/notifications/types';
import { useOrdersQuery } from '@/modules/orders/hooks/use-orders';
import { useReturnsQuery } from '@/modules/returns/hooks/use-returns';
import { useHasPermission } from '@/modules/users/hooks/use-org';
import { formatCurrency } from '@/lib/formatters';
import { useNotificationsStore } from '@/store/notifications-store';

import { mergeNotificationFeeds } from './merge-notifications';
import type { AppNotification } from './types';

function persistedToAppNotification(item: NotificationListItem): AppNotification {
  return {
    id: item.id,
    tone: severityToTone(item.severity),
    title: item.title,
    description: item.body,
    href: (item.href ?? '/dashboard') as Route,
    read: item.read,
  };
}

/**
 * The shell's notification tray feed — a UNION of two tiers (see
 * docs/roadmap/notification-engine.md):
 *  - PERSISTED rows (discrete lifecycle events, server read state) via the
 *    notifications module, and
 *  - LIVE DERIVED signals (the rolled-up "needs my attention" counts) computed
 *    from queries the app already keeps warm — read state still client-side this
 *    phase. STUB CONTRACT (jujur, mirrors Pandu): every number is REAL data; only
 *    selection + ordering is rule-based. The two tiers reconcile by id/dedupeKey,
 *    so the bell's external contract never changes.
 */
export function useNotifications() {
  const orders = useOrdersQuery(1, 1, { status: 'PAID' });
  const returns = useReturnsQuery('PENDING', 1, 1);
  const dashboard = useInventoryDashboardQuery();
  const reorder = useReorderReportQuery({
    windowDays: REORDER_DEFAULTS.windowDays,
    leadTimeDays: REORDER_DEFAULTS.leadTimeDays,
    targetCoverDays: REORDER_DEFAULTS.targetCoverDays,
  });
  const { allowed: canViewMarketplace } = useHasPermission('marketplace.view');
  const marketplaceHealth = useMarketplaceHealthQuery(canViewMarketplace);
  const persisted = useNotificationsQuery();

  const readIds = useNotificationsStore((state) => state.readIds);
  const storeMarkRead = useNotificationsStore((state) => state.markRead);
  const storeMarkAllRead = useNotificationsStore((state) => state.markAllRead);
  const markReadMutation = useMarkNotificationReadMutation();
  const markAllReadMutation = useMarkAllNotificationsReadMutation();

  const invSummary = dashboard.data?.summary;
  const reorderSummary = reorder.data?.summary;

  // Highest-attention first so the tray reads top-down by urgency.
  const derivedCandidates: Omit<AppNotification, 'read'>[] = [];

  if (invSummary && invSummary.oversoldCount > 0) {
    derivedCandidates.push({
      id: `oversold:${invSummary.oversoldCount}`,
      tone: 'urgent',
      title: 'Stok oversold',
      description: `${invSummary.oversoldCount} varian stok sistemnya minus — rapikan selisihnya sebelum numpuk.`,
      href: '/dashboard/inventory',
    });
  }

  if (reorderSummary && reorderSummary.urgentCount > 0) {
    const topUrgent = reorder.data?.items.find((item) => item.status === 'URGENT');
    const days =
      topUrgent?.daysOfCover != null ? Math.max(0, Math.round(topUrgent.daysOfCover)) : null;
    const others = reorderSummary.urgentCount - 1;
    derivedCandidates.push({
      id: `restock-urgent:${reorderSummary.urgentCount}:${topUrgent?.variantId ?? 'none'}`,
      tone: 'urgent',
      title: 'Restok mendesak',
      description: topUrgent
        ? `Stok ${topUrgent.productName} ${topUrgent.variantName} habis ${days != null ? `±${days} hari lagi` : 'sebelum restok datang'}${others > 0 ? ` (+${others} varian lain)` : ''}.`
        : `${reorderSummary.urgentCount} varian bakal habis sebelum restok datang.`,
      href: '/dashboard/inventory/reorder',
    });
  }

  if (canViewMarketplace) {
    const dangerCount =
      marketplaceHealth.data?.filter((item) => item.tone === 'danger').length ?? 0;
    if (dangerCount > 0) {
      derivedCandidates.push({
        id: `marketplace-danger:${dangerCount}`,
        tone: 'urgent',
        title: 'Channel marketplace bermasalah',
        description: `${dangerCount} koneksi perlu perhatian — token kedaluwarsa atau sinkron gagal.`,
        href: '/dashboard/marketplace',
      });
    }
  }

  if (orders.data && orders.data.meta.total > 0) {
    derivedCandidates.push({
      id: `orders-to-ship:${orders.data.meta.total}`,
      tone: 'info',
      title: 'Pesanan siap dikirim',
      description: `${orders.data.meta.total} pesanan sudah dibayar dan menunggu dikirim.`,
      href: '/dashboard/orders',
    });
  }

  if (returns.data && returns.data.meta.total > 0) {
    derivedCandidates.push({
      id: `returns-pending:${returns.data.meta.total}`,
      tone: 'info',
      title: 'Retur menunggu diproses',
      description: `${returns.data.meta.total} retur menunggu kamu proses (restok atau rusak).`,
      href: '/dashboard/returns',
    });
  }

  if (invSummary && invSummary.lowStockCount > 0) {
    derivedCandidates.push({
      id: `low-stock:${invSummary.lowStockCount}`,
      tone: 'info',
      title: 'Stok menipis',
      description: `${invSummary.lowStockCount} varian menipis di bawah batas stoknya.`,
      href: '/dashboard/inventory?status=low' as Route,
    });
  }

  if (reorderSummary && reorderSummary.deadStockCount > 0) {
    derivedCandidates.push({
      id: `dead-stock:${reorderSummary.deadStockCount}:${reorderSummary.deadStockValue}`,
      tone: 'info',
      title: 'Modal mengendap',
      description: `${formatCurrency(reorderSummary.deadStockValue)} modal mengendap di ${reorderSummary.deadStockCount} varian tanpa penjualan ${REORDER_DEFAULTS.deadStockDays} hari.`,
      href: '/dashboard/inventory/reorder',
    });
  }

  const derivedItems: AppNotification[] = derivedCandidates.map((candidate) => ({
    ...candidate,
    read: readIds.includes(candidate.id),
  }));

  const persistedListItems = persisted.data?.items ?? [];
  const persistedItems = persistedListItems.map(persistedToAppNotification);
  const persistedDedupeKeys = new Set(persistedListItems.map((item) => item.dedupeKey));
  const persistedIds = new Set(persistedListItems.map((item) => item.id));

  const items = mergeNotificationFeeds(persistedItems, derivedItems, persistedDedupeKeys);

  const derivedUnread = derivedItems.filter(
    (item) => !item.read && !persistedDedupeKeys.has(item.id),
  ).length;
  const unreadCount = (persisted.data?.unreadCount ?? 0) + derivedUnread;

  function markRead(id: string) {
    if (persistedIds.has(id)) {
      markReadMutation.mutate(id);
    } else {
      storeMarkRead(id);
    }
  }

  function markAllRead() {
    if ((persisted.data?.unreadCount ?? 0) > 0) markAllReadMutation.mutate();
    storeMarkAllRead(derivedItems.map((item) => item.id));
  }

  return {
    items,
    unreadCount,
    hasUrgentUnread: items.some((item) => !item.read && item.tone === 'urgent'),
    // A persisted-feed error does NOT blank the tray — the derived signals still render.
    isLoading: orders.isLoading || returns.isLoading || dashboard.isLoading || reorder.isLoading,
    isError: Boolean(orders.error ?? returns.error ?? dashboard.error ?? reorder.error),
    markRead,
    markAllRead,
  };
}

export type { AppNotification, AppNotificationTone } from './types';
