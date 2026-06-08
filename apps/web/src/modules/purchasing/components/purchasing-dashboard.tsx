'use client';

import Link from 'next/link';
import { Plus, Truck } from 'lucide-react';

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

import { usePurchaseOrdersQuery } from '../hooks/use-purchase-orders';
import { PurchaseOrderStatusBadge } from './purchase-order-status-badge';

export function PurchasingDashboard() {
  const { data, isLoading, error } = usePurchaseOrdersQuery();
  const orders = data ?? [];
  const isEmpty = !isLoading && orders.length === 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button asChild>
          <Link href="/dashboard/purchasing/new">
            <Plus className="size-4" />
            Pembelian baru
          </Link>
        </Button>
      </div>

      {error ? (
        <div className="border-destructive/30 bg-destructive/5 text-destructive rounded-lg border p-4 text-sm">
          Gagal memuat daftar pembelian. {error instanceof Error ? error.message : 'Coba lagi, ya.'}
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
          icon={Truck}
          title="Belum ada pembelian"
          description="Pesan stok dari pemasok — stok muncul sebagai akan datang, lalu jadi tersedia saat kamu terima."
          action={
            <Button asChild>
              <Link href="/dashboard/purchasing/new">
                <Plus className="size-4" />
                Pembelian baru
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pembelian</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Item</TableHead>
                <TableHead className="text-right">Total modal</TableHead>
                <TableHead>Dipesan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>
                    <Link
                      href={`/dashboard/purchasing/${order.id}`}
                      className="font-medium hover:underline"
                    >
                      {order.code}
                    </Link>
                    <div className="text-muted-foreground text-xs">
                      {order.supplierName ?? 'Tanpa pemasok'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <PurchaseOrderStatusBadge status={order.status} />
                  </TableCell>
                  <TableCell className="num text-right">{order.itemCount}</TableCell>
                  <TableCell className="num text-right font-medium">
                    {formatCurrency(order.totalCost)}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                    <span suppressHydrationWarning>{formatDateTime(order.orderedAt)}</span>
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
