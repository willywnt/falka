'use client';

import { useState } from 'react';
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
import { StatusBadge } from '@/components/status-badge';
import { TablePagination } from '@/components/table-pagination';
import { usePagination } from '@/hooks/use-pagination';
import { formatDateTime } from '@/lib/formatters';

import { useReturnsQuery } from '../hooks/use-returns';
import { ReturnStatusBadge } from './return-status-badge';

const FILTERS: ReadonlyArray<{ label: string; value: ReturnStatus | 'ALL' }> = [
  { label: 'Semua', value: 'ALL' },
  { label: 'Menunggu barang', value: 'PENDING' },
  { label: 'Diterima', value: 'RECEIVED' },
  { label: 'Ditolak', value: 'REJECTED' },
];

export function ReturnsDashboard() {
  const [filter, setFilter] = useState<ReturnStatus | 'ALL'>('ALL');
  const { page, setPage, pageSize, setPageSize } = usePagination();
  const { data, isLoading, error } = useReturnsQuery(
    filter === 'ALL' ? undefined : filter,
    page,
    pageSize,
  );

  const returns = data?.items ?? [];
  const total = data?.meta.total ?? 0;
  const isEmpty = !isLoading && total === 0;

  function changeFilter(value: ReturnStatus | 'ALL') {
    setFilter(value);
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
            variant={filter === option.value ? 'default' : 'outline'}
            onClick={() => changeFilter(option.value)}
          >
            {option.label}
          </Button>
        ))}
      </div>

      {error ? (
        <div className="border-destructive/30 bg-destructive/5 text-destructive rounded-lg border p-4 text-sm">
          Gagal memuat retur. {error instanceof Error ? error.message : 'Coba lagi.'}
        </div>
      ) : null}

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-12 w-full" />
          ))}
        </div>
      ) : isEmpty ? (
        <EmptyState
          icon={Undo2}
          title="Belum ada retur"
          description="Retur terbuka otomatis kalau pesanan yang sudah dikirim dibatalkan, atau kamu bisa buka sendiri dari halaman pesanan."
        />
      ) : (
        <div className="space-y-3">
          <div className="overflow-x-auto rounded-xl border">
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
                        className="font-medium hover:underline"
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
