'use client';

import { useEffect, useState } from 'react';

import { ErrorState } from '@/components/error-state';
import { StatusBadge } from '@/components/status-badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { useOrdersBoardQuery } from '../hooks/use-orders';
import type { OrderListItem } from '../types';

/*
 * Packing-station board: today's parcels at a glance, in the app's standard
 * table dress. No sockets, no flip animation — the 20s query poll in
 * useOrdersBoardQuery is the only "mechanism", so reduced-motion stays happy.
 */

/** id-ID renders HH.mm.ss with dots — reads like a station clock. */
const timeFormat = new Intl.DateTimeFormat('id-ID', {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
});

const SHIPPED_ROW_LIMIT = 10;

function BoardClock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1_000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <span className="num text-2xl font-semibold tracking-tight" suppressHydrationWarning>
      {timeFormat.format(now)}
    </span>
  );
}

function BoardRow({ order, departed = false }: { order: OrderListItem; departed?: boolean }) {
  return (
    <TableRow>
      <TableCell className="num font-medium">
        {order.trackingNumber ?? <span className="text-muted-foreground">— belum ada resi</span>}
      </TableCell>
      <TableCell>{order.shopName}</TableCell>
      <TableCell>{order.buyerName ?? '—'}</TableCell>
      <TableCell className="num text-right">{order.itemCount}</TableCell>
      <TableCell>
        {departed ? (
          <StatusBadge tone="info">Dikirim</StatusBadge>
        ) : order.fulfilledAt ? (
          <StatusBadge tone="ok">Terekam — siap kirim</StatusBadge>
        ) : (
          <StatusBadge tone="warn">Menunggu dikemas</StatusBadge>
        )}
      </TableCell>
    </TableRow>
  );
}

function BoardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border">
      <Skeleton className="h-10 w-full rounded-none" />
      <div className="divide-y">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="flex items-center gap-6 px-4 py-3">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-4 w-1/6" />
            <Skeleton className="h-4 w-1/5" />
            <Skeleton className="ml-auto h-5 w-40" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function DepartureBoard() {
  const paidQuery = useOrdersBoardQuery('PAID');
  const shippedQuery = useOrdersBoardQuery('SHIPPED');

  const isLoading = paidQuery.isLoading || shippedQuery.isLoading;
  const error = paidQuery.error ?? shippedQuery.error;
  const waitingOrders = paidQuery.data?.items ?? [];
  const departedOrders = (shippedQuery.data?.items ?? []).slice(0, SHIPPED_ROW_LIMIT);
  const isEmpty = waitingOrders.length === 0 && departedOrders.length === 0;

  const updatedAt = Math.max(paidQuery.dataUpdatedAt, shippedQuery.dataUpdatedAt);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <p className="eyebrow text-primary">Papan keberangkatan</p>
          <p className="text-muted-foreground text-sm" suppressHydrationWarning>
            {updatedAt > 0 ? (
              <>
                Diperbarui <span className="num">{timeFormat.format(new Date(updatedAt))}</span> ·
                refresh otomatis tiap <span className="num">20</span> detik
              </>
            ) : (
              'Refresh otomatis tiap 20 detik'
            )}
          </p>
        </div>
        <BoardClock />
      </div>

      {isLoading ? (
        <BoardSkeleton />
      ) : error ? (
        <ErrorState
          title="Gagal memuat papan"
          description={error instanceof Error ? error.message : undefined}
          onRetry={() => {
            void paidQuery.refetch();
            void shippedQuery.refetch();
          }}
        />
      ) : isEmpty ? (
        <div className="flex flex-col items-center gap-1 rounded-xl border border-dashed p-16 text-center">
          <p className="text-lg font-medium">Tidak ada paket menunggu — laut tenang.</p>
          <p className="text-muted-foreground text-sm">
            Pesanan berstatus dibayar atau terkirim bakal muncul di sini.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Resi</TableHead>
                <TableHead>Toko</TableHead>
                <TableHead>Pembeli</TableHead>
                <TableHead className="text-right">Item</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {waitingOrders.map((order) => (
                <BoardRow key={order.id} order={order} />
              ))}
              {departedOrders.length > 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={5} className="bg-muted/40 py-1.5">
                    <span className="eyebrow text-muted-foreground">Baru berangkat</span>
                  </TableCell>
                </TableRow>
              ) : null}
              {departedOrders.map((order) => (
                <BoardRow key={order.id} order={order} departed />
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
