'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { Undo2 } from 'lucide-react';
import type { ReturnStatus } from '@prisma/client';

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
import { StatusBadge } from '@/components/status-badge';
import { TablePagination } from '@/components/table-pagination';
import { usePagination } from '@/hooks/use-pagination';
import { useUrlFilters } from '@/hooks/use-url-filters';
import { formatDateTime } from '@/lib/formatters';

import { useReturnsQuery } from '../hooks/use-returns';
import { ReturnStatusBadge } from './return-status-badge';

const FILTERS: ReadonlyArray<{ label: string; value: ReturnStatus | 'ALL' }> = [
  { label: 'Semua', value: 'ALL' },
  { label: 'Menunggu barang', value: 'PENDING' },
  { label: 'Diterima', value: 'RECEIVED' },
  { label: 'Ditolak', value: 'REJECTED' },
];

/** Table-shaped skeleton (header band + row bars) — shared by loading + Suspense fallback. */
function ReturnsTableSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border">
      <Skeleton className="h-10 w-full rounded-none" />
      <div className="divide-y">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="flex items-center gap-4 px-4 py-3.5">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-5 w-24" />
            <Skeleton className="ml-auto h-4 w-8" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Lightweight stand-in matching the page rhythm while the URL-synced filter hydrates. */
function ReturnsDashboardFallback() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((option) => (
          <Skeleton key={option.value} className="h-8 w-24" />
        ))}
      </div>
      <ReturnsTableSkeleton />
    </div>
  );
}

export function ReturnsDashboard() {
  return (
    <Suspense fallback={<ReturnsDashboardFallback />}>
      <ReturnsDashboardContent />
    </Suspense>
  );
}

function ReturnsDashboardContent() {
  // ?status= lives in the URL so back/refresh keeps the active chip.
  const [filters, setFilters] = useUrlFilters({ status: 'ALL' });
  const { page, setPage, pageSize, setPageSize } = usePagination();

  const status: ReturnStatus | 'ALL' =
    filters.status === 'PENDING' || filters.status === 'RECEIVED' || filters.status === 'REJECTED'
      ? filters.status
      : 'ALL';

  const { data, isLoading, error, refetch } = useReturnsQuery(
    status === 'ALL' ? undefined : status,
    page,
    pageSize,
  );

  const returns = data?.items ?? [];
  const total = data?.meta.total ?? 0;
  const isEmpty = !isLoading && total === 0;

  function changeFilter(value: ReturnStatus | 'ALL') {
    setFilters({ status: value });
    setPage(1);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((option) => (
          <Button
            key={option.value}
            type="button"
            size="sm"
            variant={status === option.value ? 'default' : 'outline'}
            onClick={() => changeFilter(option.value)}
          >
            {option.label}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <ReturnsTableSkeleton />
      ) : error ? (
        <ErrorState
          title="Gagal memuat retur"
          description={error instanceof Error ? error.message : undefined}
          onRetry={() => void refetch()}
        />
      ) : isEmpty ? (
        <EmptyState
          icon={Undo2}
          title="Belum ada retur"
          description={
            status === 'ALL'
              ? 'Retur terbuka otomatis kalau pesanan yang sudah dikirim dibatalkan, atau kamu bisa buka sendiri dari halaman pesanan.'
              : 'Tidak ada retur dengan status ini.'
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
                  <TableHead className="text-right">Item</TableHead>
                  <TableHead>Dibuka</TableHead>
                  <TableHead>Diproses</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {returns.map((ret) => (
                  <TableRow key={ret.id}>
                    <TableCell>
                      <Link
                        href={`/dashboard/returns/${ret.id}`}
                        className="num font-medium hover:underline"
                      >
                        {ret.externalOrderId}
                      </Link>
                      <div className="text-muted-foreground text-xs">
                        {ret.shopName}
                        {ret.autoDetected ? ' · otomatis' : ''}
                      </div>
                    </TableCell>
                    <TableCell>
                      <ReturnStatusBadge status={ret.status} />
                    </TableCell>
                    <TableCell className="num text-right">{ret.itemCount}</TableCell>
                    <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                      <span suppressHydrationWarning>{formatDateTime(ret.createdAt)}</span>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                      {ret.processedAt ? (
                        <span suppressHydrationWarning>{formatDateTime(ret.processedAt)}</span>
                      ) : (
                        <StatusBadge tone="warn">menunggu</StatusBadge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile: stacked cards — same data as the table rows. */}
          <div className="space-y-3 sm:hidden">
            {returns.map((ret) => (
              <article key={ret.id} className="bg-card space-y-3 rounded-xl border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      href={`/dashboard/returns/${ret.id}`}
                      className="num block truncate py-1 font-medium hover:underline"
                    >
                      {ret.externalOrderId}
                    </Link>
                    <p className="text-muted-foreground truncate text-xs">
                      {ret.shopName}
                      {ret.autoDetected ? ' · otomatis' : ''}
                    </p>
                  </div>
                  <div className="shrink-0">
                    <ReturnStatusBadge status={ret.status} />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm">
                  <span className="text-muted-foreground">
                    Item <span className="num text-foreground font-medium">{ret.itemCount}</span>
                  </span>
                  {ret.processedAt ? null : (
                    <StatusBadge tone="warn">menunggu diproses</StatusBadge>
                  )}
                </div>

                <p className="text-muted-foreground text-xs">
                  <span suppressHydrationWarning>Dibuka {formatDateTime(ret.createdAt)}</span>
                  {ret.processedAt ? (
                    <span suppressHydrationWarning>
                      {' '}
                      · diproses {formatDateTime(ret.processedAt)}
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
    </div>
  );
}
