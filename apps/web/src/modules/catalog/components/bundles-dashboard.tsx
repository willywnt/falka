'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, Boxes, Layers, MoreHorizontal, Plus, QrCode, Trash2 } from 'lucide-react';
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
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { QrCodeDialog } from '@/components/qr-code-dialog';
import { StatCard } from '@/components/stat-card';
import { TablePagination } from '@/components/table-pagination';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { usePagination } from '@/hooks/use-pagination';
import { formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';

import {
  useBundlesQuery,
  useDeleteBundleMutation,
  useMarkBundleLabelsPrintedMutation,
  type BundleStatusFilter,
} from '../hooks/use-bundles';
import type { BundleListItem } from '../types';
import { BundleImage } from './bundle-image';

export function BundlesDashboard() {
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebouncedValue(searchInput.trim(), 300);
  const [status, setStatus] = useState<BundleStatusFilter>('all');
  const { page, setPage, pageSize, setPageSize } = usePagination(10);
  const { data, isLoading, error } = useBundlesQuery(debouncedSearch, status, page, pageSize);
  const deleteBundle = useDeleteBundleMutation();
  const markPrinted = useMarkBundleLabelsPrintedMutation();
  const [qrTarget, setQrTarget] = useState<BundleListItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BundleListItem | null>(null);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status, setPage]);

  const bundles = data?.items ?? [];
  const meta = data?.meta;
  const summary = data?.summary;
  const isEmpty = !isLoading && bundles.length === 0;
  const isFiltered = Boolean(debouncedSearch) || status !== 'all';

  async function handleDelete(bundle: BundleListItem) {
    try {
      await deleteBundle.mutateAsync(bundle.id);
      toast.success('Bundel dihapus');
    } catch (deleteError) {
      toast.error('Gagal menghapus bundel', {
        description: deleteError instanceof Error ? deleteError.message : 'Coba lagi.',
      });
    } finally {
      setDeleteTarget(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        {(
          [
            {
              key: 'all',
              label: 'Semua bundel',
              value: summary?.total ?? 0,
              tone: 'muted',
              icon: Layers,
            },
            {
              key: 'available',
              label: 'Tersedia',
              value: summary?.available ?? 0,
              tone: 'emerald',
              icon: Boxes,
            },
            {
              key: 'unavailable',
              label: 'Stok habis',
              value: summary?.unavailable ?? 0,
              tone: 'amber',
              icon: AlertTriangle,
            },
          ] as const
        ).map((card) => (
          <button
            key={card.key}
            type="button"
            onClick={() => setStatus(card.key)}
            aria-pressed={status === card.key}
            className="rounded-xl text-left focus-visible:outline-none"
          >
            <StatCard
              label={card.label}
              value={card.value}
              icon={card.icon}
              tone={card.tone}
              className={cn(
                'h-full transition-colors',
                status === card.key ? 'ring-primary ring-2' : 'hover:border-primary/40',
              )}
            />
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder="Cari SKU atau nama bundel…"
          className="sm:max-w-xs"
        />
        <Button asChild>
          <Link href="/dashboard/bundles/new">
            <Plus className="size-4" />
            Bundel baru
          </Link>
        </Button>
      </div>

      {error ? (
        <div className="border-destructive/30 bg-destructive/5 text-destructive rounded-lg border p-4 text-sm">
          Gagal memuat bundel. {error instanceof Error ? error.message : 'Coba lagi.'}
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
          icon={Layers}
          title={isFiltered ? 'Tidak ada bundel yang cocok' : 'Belum ada bundel'}
          description={
            isFiltered
              ? 'Coba pencarian atau filter lain.'
              : 'Bundel itu paket jualan yang stoknya ikut varian komponen — tidak punya stok sendiri. Buat bundel pertama kamu untuk mulai.'
          }
          action={
            isFiltered ? undefined : (
              <Button asChild>
                <Link href="/dashboard/bundles/new">
                  <Plus className="size-4" />
                  Bundel baru
                </Link>
              </Button>
            )
          }
        />
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead className="text-right">Total varian</TableHead>
                  <TableHead className="text-right">Tersedia</TableHead>
                  <TableHead className="text-right">Harga</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bundles.map((bundle) => (
                  <TableRow key={bundle.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <BundleImage
                          bundleId={bundle.id}
                          imageUrl={bundle.imageUrl}
                          label={bundle.name}
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <Link
                              href={`/dashboard/bundles/${bundle.id}`}
                              className="font-medium hover:underline"
                            >
                              {bundle.name}
                            </Link>
                            {!bundle.isActive ? (
                              <Badge
                                variant="secondary"
                                className="shrink-0 px-1.5 py-0 text-[10px]"
                              >
                                Nonaktif
                              </Badge>
                            ) : null}
                          </div>
                          <div className="text-muted-foreground text-xs">{bundle.sku}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground num text-right">
                      {bundle.totalVariant}
                    </TableCell>
                    <TableCell className="num text-right font-medium">{bundle.available}</TableCell>
                    <TableCell className="num text-right">{formatCurrency(bundle.price)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="size-4" />
                            <span className="sr-only">Aksi lainnya</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setQrTarget(bundle)}>
                            <QrCode className="size-4" />
                            Tampilkan QR code
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => setDeleteTarget(bundle)}
                          >
                            <Trash2 className="size-4" />
                            Hapus bundel
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {meta && meta.total > 0 ? (
            <TablePagination
              page={meta.page}
              pageSize={pageSize}
              total={meta.total}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          ) : null}
        </>
      )}

      {qrTarget ? (
        <QrCodeDialog
          open={Boolean(qrTarget)}
          onOpenChange={(open) => {
            if (!open) setQrTarget(null);
          }}
          value={qrTarget.sku}
          title={qrTarget.name}
          subtitle={qrTarget.sku}
          onPrint={() => markPrinted.mutate([qrTarget.id])}
        />
      ) : null}

      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus “{deleteTarget?.name}”?</AlertDialogTitle>
            <AlertDialogDescription>
              Ini menghapus bundel. Varian komponen dan stoknya tidak terpengaruh. Tindakan ini
              tidak bisa dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && void handleDelete(deleteTarget)}
              disabled={deleteBundle.isPending}
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
