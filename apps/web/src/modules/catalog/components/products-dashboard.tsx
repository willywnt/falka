'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MoreHorizontal, Package, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

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
import { StatusBadge } from '@/components/status-badge';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useUrlFilters } from '@/hooks/use-url-filters';

import { useDeleteProductMutation, useProductsQuery } from '../hooks/use-products';
import type { ProductListItem } from '../types';
import { DeleteProductDialog } from './delete-product-dialog';
import { ProductFormDialog } from './product-form-dialog';

export function ProductsDashboard() {
  const [filters, setFilters] = useUrlFilters({ search: '' });
  const [searchInput, setSearchInput] = useState(filters.search);
  const debouncedSearch = useDebouncedValue(searchInput, 300);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ProductListItem | null>(null);

  useEffect(() => {
    if (debouncedSearch !== filters.search) setFilters({ search: debouncedSearch });
  }, [debouncedSearch, filters.search, setFilters]);

  const { data, isLoading, error } = useProductsQuery(filters.search.trim() || undefined);
  const deleteMutation = useDeleteProductMutation();

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;

    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success('Produk dihapus', { description: `${deleteTarget.name} telah diarsipkan.` });
      setDeleteTarget(null);
    } catch (deleteError) {
      toast.error('Gagal menghapus', {
        description: deleteError instanceof Error ? deleteError.message : 'Terjadi kesalahan',
      });
    }
  }

  const products = data ?? [];
  const isEmpty = !isLoading && products.length === 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Input
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder="Cari produk..."
          className="sm:max-w-xs"
        />
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" />
          Produk baru
        </Button>
      </div>

      {error ? (
        <div className="border-destructive/30 bg-destructive/5 text-destructive rounded-lg border p-4 text-sm">
          Gagal memuat produk. {error instanceof Error ? error.message : 'Coba lagi.'}
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
          icon={Package}
          title="Belum ada produk"
          description={
            filters.search
              ? 'Tidak ada produk yang cocok dengan pencarian kamu.'
              : 'Buat produk pertama kamu untuk mulai melacak stok.'
          }
          action={
            filters.search ? null : (
              <Button onClick={() => setCreateOpen(true)} variant="outline">
                <Plus className="size-4" />
                Produk baru
              </Button>
            )
          }
        />
      ) : (
        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produk</TableHead>
                <TableHead className="text-right">Varian</TableHead>
                <TableHead className="text-right">Tersedia</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <Link
                      href={`/dashboard/products/${product.id}`}
                      className="font-medium hover:underline"
                    >
                      {product.name}
                    </Link>
                    {product.category ? (
                      <div className="text-muted-foreground text-xs">{product.category}</div>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-right">
                    {product.variantCount === 0 ? (
                      <StatusBadge tone="warn" className="font-normal">
                        Tanpa varian
                      </StatusBadge>
                    ) : (
                      <span className="num">{product.variantCount}</span>
                    )}
                  </TableCell>
                  <TableCell className="num text-right">{product.totalAvailableStock}</TableCell>
                  <TableCell>
                    <Badge variant={product.isActive ? 'default' : 'secondary'}>
                      {product.isActive ? 'Aktif' : 'Nonaktif'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="size-4" />
                          <span className="sr-only">Buka aksi</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          disabled={deleteMutation.isPending}
                          className="text-destructive focus:text-destructive"
                          onClick={() => setDeleteTarget(product)}
                        >
                          <Trash2 className="size-4" />
                          Hapus
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <ProductFormDialog open={createOpen} onOpenChange={setCreateOpen} />

      <DeleteProductDialog
        product={deleteTarget}
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        onConfirm={() => void handleDeleteConfirm()}
        isDeleting={deleteMutation.isPending}
      />
    </div>
  );
}
