'use client';

import type { Route } from 'next';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

import { ErrorState } from '@/components/error-state';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { REORDER_DEFAULTS } from '@/modules/inventory/config';
import {
  useInventoryDashboardQuery,
  useReorderReportQuery,
} from '@/modules/inventory/hooks/use-inventory';
import { useOrdersQuery } from '@/modules/orders/hooks/use-orders';
import { useReturnsQuery } from '@/modules/returns/hooks/use-returns';
import { cn } from '@/lib/utils';

type QueueRow = {
  key: string;
  count: number;
  label: string;
  hint?: string;
  href: Route;
  countClassName: string;
  urgent?: boolean;
};

const ROW_CLASS =
  'hover:bg-muted/50 group flex min-h-10 items-center justify-between gap-3 rounded-lg border px-3 py-2 transition-colors';

/**
 * "Antrian kerja" — the dashboard work queue. Composes existing module queries
 * (same keys the shell/Pandu already warm) into prioritized, actionable rows:
 * oversold → urgent restock → paid-unshipped orders → pending returns.
 */
export function Briefing() {
  const inventory = useInventoryDashboardQuery();
  const reorder = useReorderReportQuery({
    windowDays: REORDER_DEFAULTS.windowDays,
    leadTimeDays: REORDER_DEFAULTS.leadTimeDays,
    targetCoverDays: REORDER_DEFAULTS.targetCoverDays,
  });
  const paidOrders = useOrdersQuery(1, 1, { status: 'PAID' });
  const pendingReturns = useReturnsQuery('PENDING', 1, 1);

  const isLoading =
    inventory.isPending || reorder.isPending || paidOrders.isPending || pendingReturns.isPending;
  const failedCount =
    Number(inventory.isError) +
    Number(reorder.isError) +
    Number(paidOrders.isError) +
    Number(pendingReturns.isError);

  function retryFailed() {
    if (inventory.isError) void inventory.refetch();
    if (reorder.isError) void reorder.refetch();
    if (paidOrders.isError) void paidOrders.refetch();
    if (pendingReturns.isError) void pendingReturns.refetch();
  }

  const rows: QueueRow[] = [];

  const oversoldCount = inventory.data?.summary.oversoldCount ?? 0;
  if (oversoldCount > 0) {
    rows.push({
      key: 'oversold',
      count: oversoldCount,
      label: 'varian oversold — stok sistem minus',
      href: '/dashboard/inventory',
      countClassName: 'text-destructive',
    });
  }

  const urgentCount = reorder.data?.summary.urgentCount ?? 0;
  if (urgentCount > 0) {
    rows.push({
      key: 'reorder-urgent',
      count: urgentCount,
      label: 'varian habis sebelum restok datang',
      href: '/dashboard/inventory/reorder',
      countClassName: 'text-status-warn',
      urgent: true,
    });
  }

  const paidCount = paidOrders.data?.meta.total ?? 0;
  if (paidCount > 0) {
    rows.push({
      key: 'orders-paid',
      count: paidCount,
      label: 'pesanan dibayar, belum dikirim',
      hint: 'siap packing — rekam videonya',
      href: '/dashboard/orders?status=PAID' as Route,
      countClassName: 'text-foreground',
    });
  }

  const pendingReturnCount = pendingReturns.data?.meta.total ?? 0;
  if (pendingReturnCount > 0) {
    rows.push({
      key: 'returns-pending',
      count: pendingReturnCount,
      label: 'retur menunggu diproses',
      href: '/dashboard/returns?status=PENDING' as Route,
      countClassName: 'text-foreground',
    });
  }

  return (
    <Card className="gap-4 py-4">
      <CardHeader className="gap-1 px-4">
        <CardTitle className="eyebrow text-primary">Antrian kerja · otomatis</CardTitle>
        <CardDescription className="text-xs">
          Dihitung dari data tokomu — bukan tebakan.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-4">
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : failedCount === 4 ? (
          <ErrorState title="Gagal memuat antrian" onRetry={retryFailed} className="p-5" />
        ) : rows.length === 0 && failedCount === 0 ? (
          <Link href="/dashboard/reports/profit" className={ROW_CLASS}>
            <span className="text-muted-foreground min-w-0 truncate text-sm">
              Laut tenang — nggak ada antrian. Cek laporan atau rapikan katalog.
            </span>
            <ChevronRight className="text-muted-foreground size-4 shrink-0" />
          </Link>
        ) : (
          <div className="space-y-2">
            {rows.map((row) => (
              <Link key={row.key} href={row.href} className={ROW_CLASS}>
                <span className="flex min-w-0 items-center gap-3">
                  <span
                    className={cn(
                      'num min-w-7 shrink-0 text-right text-base font-semibold',
                      row.countClassName,
                    )}
                  >
                    {row.count}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm">{row.label}</span>
                    {row.hint ? (
                      <span className="text-muted-foreground block truncate text-xs">
                        {row.hint}
                      </span>
                    ) : null}
                  </span>
                  {row.urgent ? <StatusBadge tone="urgent">Mendesak</StatusBadge> : null}
                </span>
                <ChevronRight className="text-muted-foreground size-4 shrink-0" />
              </Link>
            ))}
            {failedCount > 0 ? (
              <p className="text-muted-foreground px-1 text-xs">
                Sebagian antrian gagal dimuat —{' '}
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  className="h-auto p-0 text-xs"
                  onClick={retryFailed}
                >
                  Coba lagi
                </Button>
              </p>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
