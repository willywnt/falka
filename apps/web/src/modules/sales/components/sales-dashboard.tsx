'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, SearchX } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { usePagination } from '@/hooks/use-pagination';
import { useUrlFilters } from '@/hooks/use-url-filters';
import { formatCurrency, formatDateTime } from '@/lib/formatters';
import { cn } from '@/lib/utils';

import { useSalesQuery } from '../hooks/use-sales';
import { paymentMethodLabel } from './pos-terminal';

const URL_DEFAULTS = { search: '', page: '1' };

function NewSaleButton() {
  return (
    <Button asChild>
      <Link href="/dashboard/sales/new">
        <Plus className="size-4" />
        Penjualan baru
      </Link>
    </Button>
  );
}

function SalesTableSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border">
      <Skeleton className="h-10 w-full rounded-none" />
      <div className="divide-y">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="flex items-center gap-4 px-4 py-3.5">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="ml-auto h-4 w-12" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-5 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** The URL-filter hook reads `useSearchParams`, so the list brings its own boundary. */
export function SalesDashboard() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <Skeleton className="h-9 w-full max-w-sm" />
          <SalesTableSkeleton />
        </div>
      }
    >
      <SalesDashboardContent />
    </Suspense>
  );
}

function SalesDashboardContent() {
  const [filters, setFilters] = useUrlFilters(URL_DEFAULTS);
  const [searchInput, setSearchInput] = useState(filters.search);
  const debouncedSearch = useDebouncedValue(searchInput, 300);
  const { pageSize, setPageSize } = usePagination();

  // Push the debounced search into the URL-synced filters (resetting paging).
  useEffect(() => {
    if (debouncedSearch !== filters.search) setFilters({ search: debouncedSearch, page: '1' });
  }, [debouncedSearch, filters.search, setFilters]);

  const page = Math.max(1, Number.parseInt(filters.page, 10) || 1);
  const { data, isLoading, isFetching, error, refetch } = useSalesQuery(page, pageSize, {
    search: filters.search,
  });

  const sales = data?.items ?? [];
  const total = data?.meta.total ?? 0;
  const isEmpty = !isLoading && total === 0;
  const isFiltered = Boolean(filters.search);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder="Cari kode penjualan atau pelanggan…"
          aria-label="Cari penjualan"
          className="sm:max-w-xs"
        />
        <NewSaleButton />
      </div>

      {isLoading ? (
        <SalesTableSkeleton />
      ) : error ? (
        <ErrorState title="Gagal memuat penjualan" onRetry={() => void refetch()} />
      ) : isEmpty ? (
        isFiltered ? (
          <EmptyState
            icon={SearchX}
            title="Tidak ada penjualan yang cocok"
            description="Coba ubah kata kuncinya."
          />
        ) : (
          <EmptyState
            art={<BuoyArt />}
            title="Belum ada penjualan"
            description="Catat penjualan di toko — stoknya langsung kepotong dan ikut tersinkronisasi ke marketplace kamu."
            action={<NewSaleButton />}
          />
        )
      ) : (
        <div className={cn('space-y-3', isFetching && 'opacity-60 transition-opacity')}>
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
                        {sale.status === 'PARTIALLY_REFUNDED' ? (
                          <StatusBadge tone="warn" className="px-1.5 py-0 text-[10px]">
                            Refund sebagian
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
                      {sale.status === 'PARTIALLY_REFUNDED' ? (
                        <StatusBadge tone="warn" className="px-1.5 py-0 text-[10px]">
                          Refund sebagian
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

          <TablePagination
            page={page}
            pageSize={pageSize}
            total={total}
            onPageChange={(nextPage) => setFilters({ page: String(nextPage) })}
            onPageSizeChange={(nextSize) => {
              setPageSize(nextSize);
              setFilters({ page: '1' });
            }}
          />
        </div>
      )}
    </div>
  );
}
