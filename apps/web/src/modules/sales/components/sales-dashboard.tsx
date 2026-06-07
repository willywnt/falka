'use client';

import Link from 'next/link';
import { Plus, Receipt } from 'lucide-react';

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
import { formatCurrency, formatDateTime } from '@/lib/formatters';
import { cn } from '@/lib/utils';

import { useSalesQuery } from '../hooks/use-sales';

export function SalesDashboard() {
  const { data, isLoading, error } = useSalesQuery();
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

      {error ? (
        <div className="border-destructive/30 bg-destructive/5 text-destructive rounded-lg border p-4 text-sm">
          Gagal memuat penjualan. {error instanceof Error ? error.message : 'Coba lagi.'}
        </div>
      ) : null}

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-12 w-full" />
          ))}
        </div>
      ) : isEmpty ? (
        <EmptyState
          icon={Receipt}
          title="Belum ada penjualan"
          description="Catat penjualan di toko — stoknya sama dengan yang disinkronkan ke marketplace kamu."
          action={
            <Button asChild>
              <Link href="/dashboard/sales/new">
                <Plus className="size-4" />
                New sale
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border">
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
                        className="font-medium hover:underline"
                      >
                        {sale.code}
                      </Link>
                      {sale.status === 'VOID' ? (
                        <Badge variant="destructive" className="px-1.5 py-0 text-[10px]">
                          Dibatalkan
                        </Badge>
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
                    <Badge variant="secondary">{sale.paymentMethod}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                    <span suppressHydrationWarning>{formatDateTime(sale.createdAt)}</span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
