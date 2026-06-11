'use client';

import { useState } from 'react';
import Link from 'next/link';
import { DownloadCloud } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';
import { BuoyArt } from '@/components/maritime-art';
import { StatusBadge } from '@/components/status-badge';
import { TablePagination } from '@/components/table-pagination';
import { usePagination } from '@/hooks/use-pagination';
import { formatDateTime } from '@/lib/formatters';

import { useOrdersQuery } from '../hooks/use-orders';
import type { OrderListItem } from '../types';
import { OrderStatusBadge } from './order-status-badge';
import { PullOrdersDialog } from './pull-orders-dialog';

/** Stock-sync state — shared by the sm+ table cell and the <sm card line. */
function StockSyncState({ order, placeholder }: { order: OrderListItem; placeholder?: boolean }) {
  if (order.inventoryApplied) return <Badge variant="secondary">Sudah sinkron</Badge>;
  if (order.status === 'PAID')
    return <span className="text-muted-foreground text-xs">belum sinkron</span>;
  return placeholder ? <span className="text-muted-foreground text-xs">—</span> : null;
}

export function OrdersDashboard() {
  const { page, setPage, pageSize, setPageSize } = usePagination();
  const { data, isLoading, error, refetch } = useOrdersQuery(page, pageSize);
  const [pullOpen, setPullOpen] = useState(false);

  const orders = data?.items ?? [];
  const total = data?.meta.total ?? 0;
  const isEmpty = !isLoading && total === 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={() => setPullOpen(true)}>
          <DownloadCloud className="size-4" />
          Tarik pesanan
        </Button>
      </div>

      {isLoading ? (
        <div className="overflow-hidden rounded-xl border">
          <Skeleton className="h-10 w-full rounded-none" />
          <div className="divide-y">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="flex items-center gap-4 px-4 py-3.5">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="ml-auto h-4 w-24" />
              </div>
            ))}
          </div>
        </div>
      ) : error ? (
        <ErrorState
          title="Gagal memuat pesanan"
          description={error instanceof Error ? error.message : undefined}
          onRetry={() => void refetch()}
        />
      ) : isEmpty ? (
        <EmptyState
          art={<BuoyArt />}
          title="Pelabuhan masih sepi"
          description="Tarik pesanan dari toko kamu yang terhubung biar stoknya ikut kekelola di sini."
          action={
            <Button onClick={() => setPullOpen(true)}>
              <DownloadCloud className="size-4" />
              Tarik pesanan
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          <div className="hidden overflow-x-auto rounded-xl border sm:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pesanan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Pembeli</TableHead>
                  <TableHead className="text-right">Item</TableHead>
                  <TableHead>Stok</TableHead>
                  <TableHead>Dibuat</TableHead>
                  <TableHead>Terakhir ditarik</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <Link
                        href={`/dashboard/orders/${order.id}`}
                        className="num font-medium hover:underline"
                      >
                        {order.externalOrderId}
                      </Link>
                      <div className="text-muted-foreground text-xs">{order.shopName}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <OrderStatusBadge status={order.status} />
                        {order.fulfilledAt ? (
                          <StatusBadge tone="info">Fulfillment</StatusBadge>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{order.buyerName ?? '—'}</TableCell>
                    <TableCell className="text-right">
                      <span className="num">{order.itemCount}</span>
                      {order.unresolvedCount > 0 ? (
                        <StatusBadge tone="warn" className="ml-2">
                          <span className="num">{order.unresolvedCount}</span> belum dikaitkan
                        </StatusBadge>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <StockSyncState order={order} placeholder />
                    </TableCell>
                    <TableCell className="whitespace-nowrap" suppressHydrationWarning>
                      {formatDateTime(order.placedAt)}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                      {order.lastPulledAt ? (
                        <span suppressHydrationWarning>{formatDateTime(order.lastPulledAt)}</span>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile: stacked cards — same data as the table rows. */}
          <div className="space-y-3 sm:hidden">
            {orders.map((order) => (
              <article key={order.id} className="bg-card space-y-3 rounded-xl border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      href={`/dashboard/orders/${order.id}`}
                      className="num block truncate py-1 font-medium hover:underline"
                    >
                      {order.externalOrderId}
                    </Link>
                    <p className="text-muted-foreground truncate text-xs">{order.shopName}</p>
                  </div>
                  <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
                    <OrderStatusBadge status={order.status} />
                    {order.fulfilledAt ? <StatusBadge tone="info">Fulfillment</StatusBadge> : null}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm">
                  <span className="text-muted-foreground">
                    Pembeli{' '}
                    <span className="text-foreground font-medium">{order.buyerName ?? '—'}</span>
                  </span>
                  <span className="text-muted-foreground">
                    Item <span className="num text-foreground font-medium">{order.itemCount}</span>
                  </span>
                  {order.unresolvedCount > 0 ? (
                    <StatusBadge tone="warn">
                      <span className="num">{order.unresolvedCount}</span> belum dikaitkan
                    </StatusBadge>
                  ) : null}
                  <StockSyncState order={order} />
                </div>

                <p className="text-muted-foreground text-xs">
                  <span suppressHydrationWarning>Dibuat {formatDateTime(order.placedAt)}</span>
                  {order.lastPulledAt ? (
                    <span suppressHydrationWarning>
                      {' '}
                      · ditarik {formatDateTime(order.lastPulledAt)}
                    </span>
                  ) : null}
                </p>
              </article>
            ))}
          </div>

          <TablePagination
            page={page}
            pageSize={pageSize}
            total={total}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </div>
      )}

      <PullOrdersDialog open={pullOpen} onOpenChange={setPullOpen} />
    </div>
  );
}
