'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { CalendarPlus, MoreHorizontal, Pencil, Plus, Repeat, Trash2 } from 'lucide-react';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { formatCurrency } from '@/lib/formatters';
import { useHasPermission } from '@/modules/users/hooks/use-org';

import {
  useDeleteExpenseTemplateMutation,
  useExpenseTemplatesQuery,
  useGenerateRecurringMutation,
} from '../hooks/use-expense-templates';
import { EXPENSE_CATEGORY_LABELS, type ExpenseTemplateListItem } from '../types';
import { ExpenseTemplateFormDialog } from './expense-template-form-dialog';

function currentMonthLabel(): string {
  return new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(new Date());
}

export function ExpenseTemplatesPanel() {
  const { data, isLoading, error, refetch } = useExpenseTemplatesQuery();
  const deleteTemplate = useDeleteExpenseTemplateMutation();
  const generate = useGenerateRecurringMutation();
  const { allowed: canManage } = useHasPermission('finance.manage');

  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ExpenseTemplateListItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ExpenseTemplateListItem | null>(null);
  const [generateOpen, setGenerateOpen] = useState(false);

  const templates = data ?? [];
  const activeCount = templates.filter((template) => template.isActive).length;
  const isEmpty = !isLoading && templates.length === 0;

  function openCreate() {
    setEditTarget(null);
    setFormOpen(true);
  }

  function openEdit(template: ExpenseTemplateListItem) {
    setEditTarget(template);
    setFormOpen(true);
  }

  async function handleDelete(template: ExpenseTemplateListItem) {
    try {
      await deleteTemplate.mutateAsync(template.id);
      toast.success('Template dihapus');
    } catch (deleteError) {
      toast.error('Gagal menghapus template', {
        description: deleteError instanceof Error ? deleteError.message : 'Coba lagi.',
      });
    } finally {
      setDeleteTarget(null);
    }
  }

  async function handleGenerate() {
    const month = format(new Date(), 'yyyy-MM');
    const label = currentMonthLabel();
    try {
      const result = await generate.mutateAsync({ month });
      if (result.created > 0) {
        toast.success(`Dibuat ${result.created} biaya untuk ${label}`, {
          description:
            result.skipped > 0 ? `${result.skipped} sudah tercatat sebelumnya.` : undefined,
        });
      } else {
        toast.info(`Semua biaya ${label} sudah tercatat`, {
          description: `${result.skipped} template sudah dibuat untuk bulan ini.`,
        });
      }
    } catch (generateError) {
      toast.error('Gagal membuat biaya berulang', {
        description: generateError instanceof Error ? generateError.message : 'Coba lagi.',
      });
    } finally {
      setGenerateOpen(false);
    }
  }

  return (
    <Card className="gap-4 py-4">
      <CardHeader className="flex flex-col gap-2 px-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2 text-base">
            <Repeat className="text-muted-foreground size-4" />
            Biaya berulang
          </CardTitle>
          <CardDescription className="text-xs">
            Biaya bulanan tetap (sewa, gaji). &ldquo;Buat bulan ini&rdquo; mencatatnya ke buku —
            sekali per bulan, aman diklik ulang.
          </CardDescription>
        </div>
        {canManage ? (
          <div className="flex items-center gap-2 sm:shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setGenerateOpen(true)}
              disabled={activeCount === 0 || generate.isPending}
            >
              <CalendarPlus className="size-4" />
              Buat bulan ini
            </Button>
            <Button size="sm" onClick={openCreate}>
              <Plus className="size-4" />
              Template
            </Button>
          </div>
        ) : null}
      </CardHeader>

      <CardContent className="px-4">
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : error ? (
          <ErrorState
            title="Gagal memuat template"
            onRetry={() => void refetch()}
            className="p-5"
          />
        ) : isEmpty ? (
          <EmptyState
            icon={Repeat}
            title="Belum ada biaya berulang"
            description="Tambahkan biaya bulanan tetap seperti sewa atau gaji, lalu catat sekali klik tiap bulan."
            action={
              canManage ? (
                <Button onClick={openCreate}>
                  <Plus className="size-4" />
                  Template
                </Button>
              ) : undefined
            }
          />
        ) : (
          <>
            <div className="hidden overflow-x-auto rounded-xl border sm:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kategori</TableHead>
                    <TableHead className="text-right">Jumlah</TableHead>
                    <TableHead>Tiap tanggal</TableHead>
                    <TableHead>Status</TableHead>
                    {canManage ? <TableHead className="text-right">Aksi</TableHead> : null}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templates.map((template) => (
                    <TableRow key={template.id}>
                      <TableCell>
                        <div>{EXPENSE_CATEGORY_LABELS[template.category]}</div>
                        {template.note ? (
                          <p className="text-muted-foreground max-w-[28ch] truncate text-xs">
                            {template.note}
                          </p>
                        ) : null}
                      </TableCell>
                      <TableCell className="num text-right font-medium">
                        {formatCurrency(template.amount)}
                      </TableCell>
                      <TableCell className="num">tgl {template.dayOfMonth}</TableCell>
                      <TableCell>
                        <StatusBadge tone={template.isActive ? 'ok' : 'neutral'}>
                          {template.isActive ? 'Aktif' : 'Nonaktif'}
                        </StatusBadge>
                      </TableCell>
                      {canManage ? (
                        <TableCell className="text-right">
                          <TemplateRowActions
                            template={template}
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

            <div className="space-y-3 sm:hidden">
              {templates.map((template) => (
                <article key={template.id} className="bg-card space-y-2 rounded-xl border p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-medium">
                        {EXPENSE_CATEGORY_LABELS[template.category]}
                      </div>
                      <p className="text-muted-foreground num text-xs">
                        tiap tgl {template.dayOfMonth}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="num font-semibold">{formatCurrency(template.amount)}</span>
                      {canManage ? (
                        <TemplateRowActions
                          template={template}
                          onEdit={openEdit}
                          onDelete={setDeleteTarget}
                        />
                      ) : null}
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <StatusBadge tone={template.isActive ? 'ok' : 'neutral'}>
                      {template.isActive ? 'Aktif' : 'Nonaktif'}
                    </StatusBadge>
                    {template.note ? (
                      <p className="text-muted-foreground max-w-[20ch] truncate text-xs">
                        {template.note}
                      </p>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </CardContent>

      <ExpenseTemplateFormDialog
        template={editTarget}
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
            <AlertDialogTitle>Hapus template ini?</AlertDialogTitle>
            <AlertDialogDescription>
              Template berhenti membuat biaya bulanan. Biaya yang sudah dicatat tetap ada.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && void handleDelete(deleteTarget)}
              disabled={deleteTemplate.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={generateOpen} onOpenChange={setGenerateOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Buat biaya {currentMonthLabel()}?</AlertDialogTitle>
            <AlertDialogDescription>
              {activeCount} template aktif akan dicatat sebagai biaya bulan ini. Aman diklik ulang —
              yang sudah ada tidak digandakan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={() => void handleGenerate()} disabled={generate.isPending}>
              Buat sekarang
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

function TemplateRowActions({
  template,
  onEdit,
  onDelete,
}: {
  template: ExpenseTemplateListItem;
  onEdit: (template: ExpenseTemplateListItem) => void;
  onDelete: (template: ExpenseTemplateListItem) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreHorizontal className="size-4" />
          <span className="sr-only">Aksi template</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onEdit(template)}>
          <Pencil className="size-4" />
          Ubah
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive" onClick={() => onDelete(template)}>
          <Trash2 className="size-4" />
          Hapus
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
