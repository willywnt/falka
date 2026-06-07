'use client';

import { Fragment, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Ban, Boxes } from 'lucide-react';
import { toast } from 'sonner';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ImageThumb } from '@/components/image-thumb';
import { formatCurrency, formatDateTime } from '@/lib/formatters';

import { useSaleQuery, useVoidSaleMutation } from '../hooks/use-sales';
import type { SaleItemDetail } from '../types';

/** A run of consecutive items sharing a bundle origin, or a single standalone item. */
type ItemGroup =
  | { kind: 'bundle'; bundleName: string; items: SaleItemDetail[] }
  | { kind: 'standalone'; item: SaleItemDetail };

/** Fold the flat item list into display groups — consecutive lines from one bundle collapse. */
function groupItems(items: SaleItemDetail[]): ItemGroup[] {
  const groups: ItemGroup[] = [];
  for (const item of items) {
    if (item.bundleName) {
      const last = groups.at(-1);
      if (last?.kind === 'bundle' && last.bundleName === item.bundleName) {
        last.items.push(item);
      } else {
        groups.push({ kind: 'bundle', bundleName: item.bundleName, items: [item] });
      }
    } else {
      groups.push({ kind: 'standalone', item });
    }
  }
  return groups;
}

export function SaleDetail({ saleId }: { saleId: string }) {
  const { data, isLoading, error } = useSaleQuery(saleId);
  const voidMutation = useVoidSaleMutation();
  const [voidOpen, setVoidOpen] = useState(false);

  async function handleVoid() {
    try {
      await voidMutation.mutateAsync(saleId);
      toast.success('Penjualan dibatalkan', { description: 'Semua item telah direstok.' });
      setVoidOpen(false);
    } catch (caught) {
      toast.error('Gagal membatalkan penjualan', {
        description: caught instanceof Error ? caught.message : 'Coba lagi.',
      });
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link href="/dashboard/sales">
            <ArrowLeft className="size-4" />
            Kembali ke penjualan
          </Link>
        </Button>
        <div className="border-destructive/30 bg-destructive/5 text-destructive rounded-lg border p-4 text-sm">
          {error instanceof Error ? error.message : 'Penjualan tidak ditemukan.'}
        </div>
      </div>
    );
  }

  const groups = groupItems(data.items);

  const renderSaleItemRow = (item: SaleItemDetail, indented: boolean) => (
    <TableRow key={item.id}>
      <TableCell className={indented ? 'pl-8' : undefined}>
        <div className="flex items-center gap-3">
          <ImageThumb src={item.imageUrl} alt={item.name} />
          <div className="min-w-0">
            <div className="font-medium">{item.name}</div>
            <div className="text-muted-foreground text-xs">{item.sku}</div>
          </div>
        </div>
      </TableCell>
      <TableCell className="num text-right">{item.quantity}</TableCell>
      <TableCell className="num text-right">{formatCurrency(item.unitPrice)}</TableCell>
      <TableCell className="num text-right font-medium">{formatCurrency(item.lineTotal)}</TableCell>
    </TableRow>
  );

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href="/dashboard/sales">
          <ArrowLeft className="size-4" />
          Back to sales
        </Link>
      </Button>

      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-xl font-semibold tracking-tight">Penjualan {data.code}</h2>
        <Badge variant="secondary">{data.paymentMethod}</Badge>
        {data.status === 'VOID' ? <Badge variant="destructive">Dibatalkan</Badge> : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          <p className="text-sm font-medium">
            Item <span className="text-muted-foreground">· {data.items.length}</span>
          </p>
          <div className="rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Harga satuan</TableHead>
                  <TableHead className="text-right">Total baris</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groups.map((group) =>
                  group.kind === 'bundle' ? (
                    <Fragment key={`bundle-${group.bundleName}-${group.items[0]?.id}`}>
                      <TableRow className="hover:bg-transparent">
                        <TableCell colSpan={4} className="bg-muted/30 py-2">
                          <div className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium">
                            <Boxes className="size-3.5 text-violet-500" />
                            Bundel · {group.bundleName}
                          </div>
                        </TableCell>
                      </TableRow>
                      {group.items.map((item) => renderSaleItemRow(item, true))}
                    </Fragment>
                  ) : (
                    renderSaleItemRow(group.item, false)
                  ),
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <aside className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Penjualan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">Total</span>
                <span className="num text-right font-semibold">
                  {formatCurrency(data.totalAmount)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">Pembayaran</span>
                <span className="text-right font-medium">{data.paymentMethod}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">Pelanggan</span>
                <span className="truncate text-right font-medium">
                  {data.customerName ?? 'Pelanggan langsung'}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">Waktu</span>
                <span className="text-right font-medium" suppressHydrationWarning>
                  {formatDateTime(data.createdAt)}
                </span>
              </div>
              {data.note ? (
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">Catatan</span>
                  <span className="truncate text-right font-medium">{data.note}</span>
                </div>
              ) : null}
            </CardContent>
          </Card>

          {data.status === 'COMPLETED' ? (
            <AlertDialog open={voidOpen} onOpenChange={setVoidOpen}>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  className="text-destructive hover:text-destructive w-full"
                >
                  <Ban className="size-4" />
                  Batalkan penjualan
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Batalkan penjualan {data.code}?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Setiap item direstok ke stok tersedia dan penjualan dikeluarkan dari laporan
                    laba. Tindakan ini tidak bisa dibatalkan.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={voidMutation.isPending}>Batal</AlertDialogCancel>
                  <AlertDialogAction
                    disabled={voidMutation.isPending}
                    onClick={(event) => {
                      event.preventDefault();
                      void handleVoid();
                    }}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {voidMutation.isPending ? 'Membatalkan…' : 'Batalkan penjualan'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
