'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import { Coins, Download, MoreHorizontal, Pencil, Plus, SearchX, Trash2 } from 'lucide-react';
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
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DateRangePicker } from '@/components/date-range-picker';
import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { useHasPermission } from '@/modules/users/hooks/use-org';

import {
  expenseExportUrl,
  useDeleteExpenseMutation,
  useExpensesQuery,
} from '../hooks/use-expenses';
import { EXPENSE_CATEGORIES, EXPENSE_CATEGORY_LABELS, type ExpenseListItem } from '../types';
import { ExpenseFormDialog } from './expense-form-dialog';

export function ExpensesDashboard() {
  const [range, setRange] = useState<DateRange | undefined>(undefined);
  const [category, setCategory] = useState<string>('');

  const filters = {
    from: range?.from ? format(range.from, 'yyyy-MM-dd') : undefined,
    to: range?.to ? format(range.to, 'yyyy-MM-dd') : undefined,
    category: category || undefined,
  };

  const { data, isLoading, error, refetch } = useExpensesQuery(filters);
  const deleteExpense = useDeleteExpenseMutation();
  const { allowed: canManage } = useHasPermission('finance.manage');

  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ExpenseListItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ExpenseListItem | null>(null);

  const expenses = data ?? [];
  const total = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
  const isFiltered = Boolean(range?.from || category);
  const isEmpty = !isLoading && expenses.length === 0;

  function openCreate() {
    setEditTarget(null);
    setFormOpen(true);
  }

  function openEdit(expense: ExpenseListItem) {
    setEditTarget(expense);
    setFormOpen(true);
  }

  async function handleDelete(expense: ExpenseListItem) {
    try {
      await deleteExpense.mutateAsync(expense.id);
      toast.success('Biaya dihapus');
    } catch (deleteError) {
      toast.error('Gagal menghapus biaya', {
        description: deleteError instanceof Error ? deleteError.message : 'Coba lagi.',
      });
    } finally {
      setDeleteTarget(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <DateRangePicker value={range} onChange={setRange} placeholder="Semua tanggal" />
          <Select
            value={category}
            aria-label="Filter kategori"
            className="sm:max-w-[200px]"
            onChange={(event) => setCategory(event.target.value)}
          >
            <option value="">Semua kategori</option>
            {EXPENSE_CATEGORIES.map((value) => (
              <option key={value} value={value}>
                {EXPENSE_CATEGORY_LABELS[value]}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex items-center gap-2 sm:shrink-0">
          {expenses.length > 0 ? (
            <Button variant="outline" asChild>
              <a href={expenseExportUrl(filters)} download>
                <Download className="size-4" />
                Ekspor CSV
              </a>
            </Button>
          ) : (
            <Button variant="outline" disabled>
              <Download className="size-4" />
              Ekspor CSV
            </Button>
          )}
          {canManage ? (
            <Button onClick={openCreate}>
              <Plus className="size-4" />
              Catat biaya
            </Button>
          ) : null}
        </div>
      </div>

      {!isLoading && !error && expenses.length > 0 ? (
        <p className="text-muted-foreground text-sm">
          Total <span className="num text-foreground font-semibold">{formatCurrency(total)}</span> ·{' '}
          {expenses.length} biaya
        </p>
      ) : null}

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-12 w-full" />
          ))}
        </div>
      ) : error ? (
        <ErrorState title="Gagal memuat biaya" onRetry={() => void refetch()} />
      ) : isEmpty ? (
        isFiltered ? (
          <EmptyState
            icon={SearchX}
            title="Tidak ada biaya yang cocok"
            description="Coba ubah rentang tanggal atau kategori."
          />
        ) : (
          <EmptyState
            icon={Coins}
            title="Belum ada biaya"
            description="Catat biaya operasional (iklan, packaging, ongkir, gaji, dll.) agar laporan Laba bersih menghitung untung yang sebenarnya."
            action={
              canManage ? (
                <Button onClick={openCreate}>
                  <Plus className="size-4" />
                  Catat biaya
                </Button>
              ) : undefined
            }
          />
        )
      ) : (
        <>
          {/* Desktop table — same rows render as cards below sm. */}
          <div className="hidden overflow-x-auto rounded-xl border sm:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead className="text-right">Jumlah</TableHead>
                  <TableHead>Catatan</TableHead>
                  {canManage ? <TableHead className="text-right">Aksi</TableHead> : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell className="num whitespace-nowrap">
                      {formatDate(new Date(expense.date))}
                    </TableCell>
                    <TableCell>{EXPENSE_CATEGORY_LABELS[expense.category]}</TableCell>
                    <TableCell className="num text-right font-medium">
                      {formatCurrency(expense.amount)}
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-[20ch] truncate text-sm">
                      {expense.note ?? '—'}
                    </TableCell>
                    {canManage ? (
                      <TableCell className="text-right">
                        <ExpenseRowActions
                          expense={expense}
                          onEdit={openEdit}
                          onDelete={setDeleteTarget}
                        />
                      </TableCell>
                    ) : null}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile card list. */}
          <div className="space-y-3 sm:hidden">
            {expenses.map((expense) => (
              <article key={expense.id} className="bg-card space-y-2 rounded-xl border p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-medium">{EXPENSE_CATEGORY_LABELS[expense.category]}</div>
                    <p className="text-muted-foreground num text-xs">
                      {formatDate(new Date(expense.date))}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="num font-semibold">{formatCurrency(expense.amount)}</span>
                    {canManage ? (
                      <ExpenseRowActions
                        expense={expense}
                        onEdit={openEdit}
                        onDelete={setDeleteTarget}
                      />
                    ) : null}
                  </div>
                </div>
                {expense.note ? (
                  <p className="text-muted-foreground text-xs break-words">{expense.note}</p>
                ) : null}
              </article>
            ))}
          </div>
        </>
      )}

      <ExpenseFormDialog
        expense={editTarget}
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
            <AlertDialogTitle>Hapus biaya ini?</AlertDialogTitle>
            <AlertDialogDescription>
              Biaya dihapus dari buku dan laporan Laba bersih. Tindakan ini tidak bisa dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && void handleDelete(deleteTarget)}
              disabled={deleteExpense.isPending}
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

function ExpenseRowActions({
  expense,
  onEdit,
  onDelete,
}: {
  expense: ExpenseListItem;
  onEdit: (expense: ExpenseListItem) => void;
  onDelete: (expense: ExpenseListItem) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreHorizontal className="size-4" />
          <span className="sr-only">Aksi biaya</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onEdit(expense)}>
          <Pencil className="size-4" />
          Ubah
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive" onClick={() => onDelete(expense)}>
          <Trash2 className="size-4" />
          Hapus
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
