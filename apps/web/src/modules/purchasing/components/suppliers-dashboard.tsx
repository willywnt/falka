'use client';

import { useState } from 'react';
import { MoreHorizontal, Pencil, Plus, Trash2, Truck } from 'lucide-react';
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
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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

import { useDeleteSupplierMutation, useSuppliersQuery } from '../hooks/use-suppliers';
import type { SupplierListItem } from '../types';
import { SupplierFormDialog } from './supplier-form-dialog';

/** "N hari" or an em-dash when a fallback isn't set. */
function leadLabel(days: number | null): string {
  return days === null ? '—' : `${days} hari`;
}

function usageLabel(supplier: SupplierListItem): string {
  const parts: string[] = [];
  if (supplier.variantCount > 0) parts.push(`${supplier.variantCount} varian`);
  if (supplier.purchaseOrderCount > 0) parts.push(`${supplier.purchaseOrderCount} PO`);
  return parts.length > 0 ? parts.join(' · ') : 'Belum dipakai';
}

export function SuppliersDashboard() {
  const { data, isLoading, error, refetch } = useSuppliersQuery();
  const deleteSupplier = useDeleteSupplierMutation();

  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<SupplierListItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SupplierListItem | null>(null);

  const suppliers = data ?? [];
  const isEmpty = !isLoading && suppliers.length === 0;

  function openCreate() {
    setEditTarget(null);
    setFormOpen(true);
  }

  function openEdit(supplier: SupplierListItem) {
    setEditTarget(supplier);
    setFormOpen(true);
  }

  async function handleDelete(supplier: SupplierListItem) {
    try {
      await deleteSupplier.mutateAsync(supplier.id);
      toast.success('Pemasok dihapus', {
        description: 'Riwayat PO & tautan varian tetap aman.',
      });
    } catch (deleteError) {
      toast.error('Gagal menghapus pemasok', {
        description: deleteError instanceof Error ? deleteError.message : 'Coba lagi.',
      });
    } finally {
      setDeleteTarget(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={openCreate}>
          <Plus className="size-4" />
          Tambah pemasok
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-12 w-full" />
          ))}
        </div>
      ) : error ? (
        <ErrorState title="Gagal memuat pemasok" onRetry={() => void refetch()} />
      ) : isEmpty ? (
        <EmptyState
          icon={Truck}
          title="Belum ada pemasok"
          description="Simpan pemasok dengan lead time & MOQ default — laporan reorder memakainya saat varian belum punya nilainya sendiri."
          action={
            <Button onClick={openCreate}>
              <Plus className="size-4" />
              Tambah pemasok
            </Button>
          }
        />
      ) : (
        <>
          {/* Desktop table — same rows render as cards below sm. */}
          <div className="hidden overflow-x-auto rounded-xl border sm:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pemasok</TableHead>
                  <TableHead className="text-right">Lead time</TableHead>
                  <TableHead className="text-right">MOQ</TableHead>
                  <TableHead>Dipakai</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {suppliers.map((supplier) => (
                  <TableRow key={supplier.id}>
                    <TableCell>
                      <div className="font-medium">{supplier.name}</div>
                      {supplier.phone ? (
                        <div className="text-muted-foreground num text-xs">{supplier.phone}</div>
                      ) : null}
                    </TableCell>
                    <TableCell className="num text-right">
                      {leadLabel(supplier.defaultLeadTimeDays)}
                    </TableCell>
                    <TableCell className="num text-right">
                      {supplier.defaultMinOrderQty ?? '—'}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {usageLabel(supplier)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge tone={supplier.isActive ? 'ok' : 'neutral'}>
                        {supplier.isActive ? 'Aktif' : 'Nonaktif'}
                      </StatusBadge>
                    </TableCell>
                    <TableCell className="text-right">
                      <SupplierRowActions
                        supplier={supplier}
                        onEdit={openEdit}
                        onDelete={setDeleteTarget}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile card list. */}
          <div className="space-y-3 sm:hidden">
            {suppliers.map((supplier) => (
              <article key={supplier.id} className="bg-card space-y-3 rounded-xl border p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-medium break-words">{supplier.name}</div>
                    {supplier.phone ? (
                      <p className="text-muted-foreground num text-xs">{supplier.phone}</p>
                    ) : null}
                  </div>
                  <SupplierRowActions
                    supplier={supplier}
                    onEdit={openEdit}
                    onDelete={setDeleteTarget}
                  />
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm">
                  <span className="text-muted-foreground">
                    Lead time{' '}
                    <span className="num text-foreground font-medium">
                      {leadLabel(supplier.defaultLeadTimeDays)}
                    </span>
                  </span>
                  <span className="text-muted-foreground">
                    MOQ{' '}
                    <span className="num text-foreground font-medium">
                      {supplier.defaultMinOrderQty ?? '—'}
                    </span>
                  </span>
                  <StatusBadge tone={supplier.isActive ? 'ok' : 'neutral'}>
                    {supplier.isActive ? 'Aktif' : 'Nonaktif'}
                  </StatusBadge>
                </div>
                <p className="text-muted-foreground text-xs">{usageLabel(supplier)}</p>
              </article>
            ))}
          </div>
        </>
      )}

      <SupplierFormDialog
        supplier={editTarget}
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditTarget(null);
        }}
      />

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
              Pemasok disembunyikan dari daftar & pilihan. Riwayat PO dan tautan varian tetap
              tersimpan (tinggal tak lagi memberi default reorder).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && void handleDelete(deleteTarget)}
              disabled={deleteSupplier.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function SupplierRowActions({
  supplier,
  onEdit,
  onDelete,
}: {
  supplier: SupplierListItem;
  onEdit: (supplier: SupplierListItem) => void;
  onDelete: (supplier: SupplierListItem) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreHorizontal className="size-4" />
          <span className="sr-only">Aksi pemasok</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onEdit(supplier)}>
          <Pencil className="size-4" />
          Ubah
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive" onClick={() => onDelete(supplier)}>
          <Trash2 className="size-4" />
          Hapus
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
