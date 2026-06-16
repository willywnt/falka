'use client';

import type { Route } from 'next';

import { REORDER_DEFAULTS } from '@/modules/inventory/config';
import {
  useInventoryDashboardQuery,
  useReorderReportQuery,
} from '@/modules/inventory/hooks/use-inventory';
import { useMarketplaceHealthQuery } from '@/modules/marketplace/hooks/use-marketplace-health';
import { useOrdersQuery } from '@/modules/orders/hooks/use-orders';
import { useReturnsQuery } from '@/modules/returns/hooks/use-returns';
import { useHasPermission } from '@/modules/users/hooks/use-org';
import { formatCurrency } from '@/lib/formatters';
import { useNotificationsStore } from '@/store/notifications-store';

export type AppNotificationTone = 'urgent' | 'info';

export type AppNotification = {
  /** Stable per-datum id — marking read re-arms when the underlying number changes. */
  id: string;
  tone: AppNotificationTone;
  title: string;
  description: string;
  href: Route;
  read: boolean;
};

/**
 * The shell's notification tray feed — the "what needs me" inbox behind the
 * navbar bell. STUB CONTRACT (jujur, mirrors Pandu): every number is REAL data
 * from queries the app already keeps warm (ops-pulse + Pandu share these exact
 * keys, so TanStack serves them from cache — no extra network); only the
 * selection + ordering is rule-based. This selector is the single piece that a
 * future persistent notification store would swap.
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

  const readIds = useNotificationsStore((state) => state.readIds);
  const markRead = useNotificationsStore((state) => state.markRead);
  const markAllRead = useNotificationsStore((state) => state.markAllRead);

  const invSummary = dashboard.data?.summary;
  const reorderSummary = reorder.data?.summary;

  // Highest-attention first so the tray reads top-down by urgency.
  const candidates: Omit<AppNotification, 'read'>[] = [];

  if (invSummary && invSummary.oversoldCount > 0) {
    candidates.push({
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
    candidates.push({
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
      candidates.push({
        id: `marketplace-danger:${dangerCount}`,
        tone: 'urgent',
        title: 'Channel marketplace bermasalah',
        description: `${dangerCount} koneksi perlu perhatian — token kedaluwarsa atau sinkron gagal.`,
        href: '/dashboard/marketplace',
      });
    }
  }

  if (orders.data && orders.data.meta.total > 0) {
    candidates.push({
      id: `orders-to-ship:${orders.data.meta.total}`,
      tone: 'info',
      title: 'Pesanan siap dikirim',
      description: `${orders.data.meta.total} pesanan sudah dibayar dan menunggu dikirim.`,
      href: '/dashboard/orders',
    });
  }

  if (returns.data && returns.data.meta.total > 0) {
    candidates.push({
      id: `returns-pending:${returns.data.meta.total}`,
      tone: 'info',
      title: 'Retur menunggu diproses',
      description: `${returns.data.meta.total} retur menunggu kamu proses (restok atau rusak).`,
      href: '/dashboard/returns',
    });
  }

  if (invSummary && invSummary.lowStockCount > 0) {
    candidates.push({
      id: `low-stock:${invSummary.lowStockCount}`,
      tone: 'info',
      title: 'Stok menipis',
      description: `${invSummary.lowStockCount} varian menipis di bawah batas stoknya.`,
      href: '/dashboard/inventory?low=1' as Route,
    });
  }

  if (reorderSummary && reorderSummary.deadStockCount > 0) {
    candidates.push({
      id: `dead-stock:${reorderSummary.deadStockCount}:${reorderSummary.deadStockValue}`,
      tone: 'info',
      title: 'Modal mengendap',
      description: `${formatCurrency(reorderSummary.deadStockValue)} modal mengendap di ${reorderSummary.deadStockCount} varian tanpa penjualan ${REORDER_DEFAULTS.deadStockDays} hari.`,
      href: '/dashboard/inventory/reorder',
    });
  }

  const items: AppNotification[] = candidates.map((candidate) => ({
    ...candidate,
    read: readIds.includes(candidate.id),
  }));

  const unreadCount = items.reduce((total, item) => (item.read ? total : total + 1), 0);

  return {
    items,
    unreadCount,
    hasUrgentUnread: items.some((item) => !item.read && item.tone === 'urgent'),
    isLoading: orders.isLoading || returns.isLoading || dashboard.isLoading || reorder.isLoading,
    isError: Boolean(orders.error ?? returns.error ?? dashboard.error ?? reorder.error),
    markRead,
    markAllRead: () => markAllRead(items.map((item) => item.id)),
  };
}
