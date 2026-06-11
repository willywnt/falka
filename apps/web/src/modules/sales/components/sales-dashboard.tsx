'use client';

import Link from 'next/link';
import { Plus } from 'lucide-react';

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
import { formatCurrency, formatDateTime } from '@/lib/formatters';
import { cn } from '@/lib/utils';

import { useSalesQuery } from '../hooks/use-sales';
import { paymentMethodLabel } from './pos-terminal';

export function SalesDashboard() {
  const { data, isLoading, error, refetch } = useSalesQuery();
  const sales = data ?? [];
  const isEmpty = !isLoading && sales.length === 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button asChild>
          <Link href="/dashboard/sales/new">
            <Plus className="size-4" />
            Penjualan baru
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-12 w-full" />
          ))}
        </div>
      ) : error ? (
        <ErrorState title="Gagal memuat penjualan" onRetry={() => void refetch()} />
      ) : isEmpty ? (
        <EmptyState
          art={<BuoyArt />}
          title="Belum ada penjualan"
          description="Catat penjualan di toko — stoknya langsung kepotong dan ikut tersinkronisasi ke marketplace kamu."
          action={
            <Button asChild>
              <Link href="/dashboard/sales/new">
                <Plus className="size-4" />
                Penjualan baru
              </Link>
            </Button>
          }
        />
      ) : (
        <>
          {/* Desktop: the full table. */}
          <div className="hidden overflow-x-auto rounded-xl border sm:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Penjualan</TableHead>
                  <TableHead className="text-right">Item</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Pembayaran</TableHead>
                  <TableHead>Waktu</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/dashboard/sales/${sale.id}`}
                          className="num font-medium hover:underline"
                        >
                          {sale.code}
                        </Link>
                        {sale.status === 'VOID' ? (
                          <StatusBadge tone="danger" className="px-1.5 py-0 text-[10px]">
                            Dibatalkan
                          </StatusBadge>
                        ) : null}
                      </div>
                      <div className="text-muted-foreground text-xs">
                        {sale.customerName ?? 'Pelanggan langsung'}
                      </div>
                    </TableCell>
                    <TableCell className="num text-right">{sale.itemCount}</TableCell>
                    <TableCell
                      className={cn(
                        'num text-right font-medium',
                        sale.status === 'VOID' && 'text-muted-foreground line-through',
                      )}
                    >
                      {formatCurrency(sale.totalAmount)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{paymentMethodLabel(sale.paymentMethod)}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                      <span suppressHydrationWarning>{formatDateTime(sale.createdAt)}</span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile: stacked cards — same data as the table. */}
          <div className="space-y-3 sm:hidden">
            {sales.map((sale) => (
              <article key={sale.id} className="bg-card rounded-xl border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/dashboard/sales/${sale.id}`}
                        className="num font-medium hover:underline"
                      >
                        {sale.code}
                      </Link>
                      {sale.status === 'VOID' ? (
                        <StatusBadge tone="danger" className="px-1.5 py-0 text-[10px]">
                          Dibatalkan
                        </StatusBadge>
                      ) : null}
                    </div>
                    <p className="text-muted-foreground truncate text-xs">
                      {sale.customerName ?? 'Pelanggan langsung'}
                    </p>
                  </div>
                  <span
                    className={cn(
                      'num shrink-0 font-semibold',
                      sale.status === 'VOID' && 'text-muted-foreground line-through',
                    )}
                  >
                    {formatCurrency(sale.totalAmount)}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm">
                  <span className="text-muted-foreground">
                    Item <span className="num text-foreground font-medium">{sale.itemCount}</span>
                  </span>
                  <Badge variant="secondary">{paymentMethodLabel(sale.paymentMethod)}</Badge>
                  <span className="text-muted-foreground text-xs" suppressHydrationWarning>
                    {formatDateTime(sale.createdAt)}
                  </span>
                </div>
              </article>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
