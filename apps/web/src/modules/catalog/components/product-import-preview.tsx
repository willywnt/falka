'use client';

import { useEffect, useMemo, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Check, Loader2, Pencil, RefreshCw, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { StatusBadge, type StatusTone } from '@/components/status-badge';
import { cn } from '@/lib/utils';

import { fetchImportContext, useImportProductsMutation } from '../hooks/use-products';
import type { ProductImportField, ProductImportReport, ProductImportStatus } from '../types';
import { PRODUCT_CSV_COLUMNS, rowsToImportCsv } from '../utils/product-csv';
import type { RawProductRow } from '../utils/parse-products-csv';
import {
  effectiveImportSku,
  planProductImport,
  type ImportPlanContext,
} from '../utils/product-import-plan';

const STATUS_META: Record<ProductImportStatus, { tone: StatusTone; label: string; help: string }> =
  {
    create: { tone: 'info', label: 'Buat', help: 'Produk/varian baru akan dibuat saat impor.' },
    update: {
      tone: 'ok',
      label: 'Perbarui',
      help: 'SKU cocok dengan varian yang ada — harga/modal/nama/grup-nya diperbarui.',
    },
    skip: {
      tone: 'neutral',
      label: 'Lewati',
      help: 'Tidak ada perubahan untuk baris ini — dilewati.',
    },
    error: {
      tone: 'danger',
      label: 'Error',
      help: 'Baris bermasalah — perbaiki atau hapus; baris ini tidak akan diimpor.',
    },
  };

// Preview columns mirror the template, minus Barcode (kept in data, not shown/edited here).
const PREVIEW_COLUMNS = PRODUCT_CSV_COLUMNS.filter((column) => column.field !== 'barcode');

export function ProductImportPreview({
  open,
  onOpenChange,
  rows,
  setRows,
  onReupload,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rows: RawProductRow[];
  setRows: (rows: RawProductRow[]) => void;
  onReupload: () => void;
}) {
  const importMutation = useImportProductsMutation();
  const [committed, setCommitted] = useState<ProductImportReport | null>(null);
  const [editingLine, setEditingLine] = useState<number | null>(null);
  const [draft, setDraft] = useState<RawProductRow | null>(null);

  // Any change to the source rows (an edit, a delete, a reupload) invalidates a prior commit result.
  useEffect(() => {
    setCommitted(null);
    setEditingLine(null);
    setDraft(null);
  }, [rows]);

  // Resolve which SKUs / product names already exist — re-fetched whenever the
  // effective SKU set or names change (so an edited or generated SKU is re-checked
  // against the DB). Uses the EFFECTIVE SKU (typed or generated) for matching.
  const resolveInput = useMemo(() => {
    const skus = rows.map((row) => effectiveImportSku(row)).filter(Boolean);
    const names = rows.map((row) => row.productName.trim()).filter(Boolean);
    return { skus, names };
  }, [rows]);

  const contextQuery = useQuery({
    queryKey: ['catalog', 'import-resolve', resolveInput],
    queryFn: () => fetchImportContext(resolveInput.skus, resolveInput.names),
    enabled: open,
    placeholderData: keepPreviousData,
  });
  const context = contextQuery.data ?? null;
  const resolving = !context && contextQuery.isLoading;

  const planContext = useMemo<ImportPlanContext>(
    () => ({
      existingVariantsBySku: new Map(Object.entries(context?.variantsBySku ?? {})),
      existingProductIdsByName: new Map(Object.entries(context?.productIdsByName ?? {})),
    }),
    [context],
  );

  const plan = useMemo(() => planProductImport(rows, planContext), [rows, planContext]);
  const rawByLine = useMemo(() => new Map(rows.map((row) => [row.line, row])), [rows]);

  const displayRows = committed ? committed.rows : plan.rows;
  const summary = committed?.summary ?? plan.summary;
  const readOnly = committed !== null;
  const actionable = summary.create + summary.update;
  const pending = importMutation.isPending;

  // Surface problems: error rows float to the top, with an optional errors-only filter.
  const [showErrorsOnly, setShowErrorsOnly] = useState(false);
  useEffect(() => {
    if (summary.error === 0) setShowErrorsOnly(false);
  }, [summary.error]);

  const sortedRows = useMemo(
    () =>
      [...displayRows].sort(
        (a, b) => (a.status === 'error' ? 0 : 1) - (b.status === 'error' ? 0 : 1),
      ),
    [displayRows],
  );
  const visibleRows = showErrorsOnly ? sortedRows.filter((r) => r.status === 'error') : sortedRows;

  function startEdit(line: number) {
    const row = rawByLine.get(line);
    if (!row) return;
    setEditingLine(line);
    setDraft({ ...row });
  }

  function saveEdit() {
    if (!draft) return;
    setRows(rows.map((row) => (row.line === draft.line ? draft : row)));
    setEditingLine(null);
    setDraft(null);
  }

  function cancelEdit() {
    setEditingLine(null);
    setDraft(null);
  }

  function deleteRow(line: number) {
    setRows(rows.filter((row) => row.line !== line));
  }

  async function handleCommit() {
    try {
      const result = await importMutation.mutateAsync({ csv: rowsToImportCsv(rows), commit: true });
      setCommitted(result);
      toast.success('Impor selesai', {
        description: `${result.summary.create} dibuat, ${result.summary.update} diperbarui${
          result.summary.error > 0 ? `, ${result.summary.error} gagal` : ''
        }.`,
      });
    } catch (error) {
      toast.error('Gagal mengimpor', {
        description: error instanceof Error ? error.message : 'Terjadi kesalahan',
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] !max-w-5xl overflow-hidden">
        <DialogHeader>
          <DialogTitle>Pratinjau impor</DialogTitle>
          <DialogDescription>
            Periksa, edit, atau hapus baris sebelum mengimpor. SKU bertanda “auto” dibuat otomatis
            oleh sistem.
          </DialogDescription>
        </DialogHeader>

        {resolving ? (
          <div className="text-muted-foreground flex items-center justify-center gap-2 py-16 text-sm">
            <Loader2 className="size-4 animate-spin" />
            Memvalidasi data…
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <TooltipProvider>
                <div className="flex flex-wrap gap-1.5">
                  <SummaryBadge
                    tone="info"
                    count={summary.create}
                    label="baru"
                    help={STATUS_META.create.help}
                  />
                  <SummaryBadge
                    tone="ok"
                    count={summary.update}
                    label="perbarui"
                    help={STATUS_META.update.help}
                  />
                  <SummaryBadge
                    tone="neutral"
                    count={summary.skip}
                    label="lewati"
                    help={STATUS_META.skip.help}
                  />
                  <SummaryBadge
                    tone="danger"
                    count={summary.error}
                    label="error"
                    help={STATUS_META.error.help}
                  />
                </div>
              </TooltipProvider>

              <div className="flex items-center gap-2">
                {summary.error > 0 ? (
                  <Button
                    type="button"
                    variant={showErrorsOnly ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setShowErrorsOnly((value) => !value)}
                  >
                    {showErrorsOnly ? 'Tampilkan semua' : `Hanya error (${summary.error})`}
                  </Button>
                ) : null}
                {!readOnly ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={onReupload}
                    disabled={pending}
                  >
                    <RefreshCw className="size-4" />
                    Unggah ulang
                  </Button>
                ) : null}
              </div>
            </div>

            {committed ? (
              <div className="border-status-ok/30 bg-status-ok/10 text-status-ok rounded-lg border px-3 py-2 text-sm">
                Impor selesai. {summary.create} produk dibuat, {summary.update} diperbarui
                {summary.error > 0 ? `, ${summary.error} gagal` : ''}.
              </div>
            ) : null}

            <div className="max-h-[55vh] overflow-auto rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-28">Status</TableHead>
                    {PREVIEW_COLUMNS.map((column) => (
                      <TableHead key={column.field} className="whitespace-nowrap">
                        {column.header}
                        {column.required ? <span className="text-destructive">*</span> : null}
                      </TableHead>
                    ))}
                    {!readOnly ? <TableHead className="w-20 text-right">Aksi</TableHead> : null}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleRows.map((res) => {
                    const rawRow = rawByLine.get(res.line);
                    const editing = !readOnly && editingLine === res.line;
                    const meta = STATUS_META[res.status];

                    return (
                      <TableRow key={res.line}>
                        <TableCell className="align-top">
                          <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>
                          {res.message ? (
                            <div
                              className={cn(
                                'mt-1 text-xs',
                                res.status === 'error'
                                  ? 'text-destructive'
                                  : 'text-muted-foreground',
                              )}
                            >
                              {res.message}
                            </div>
                          ) : null}
                        </TableCell>

                        {PREVIEW_COLUMNS.map((column) => {
                          const field = column.field as ProductImportField;
                          const error = res.fieldErrors[field];
                          const rawValue = rawRow?.[column.field] ?? '';

                          if (editing && draft) {
                            return (
                              <TableCell key={column.field} className="align-top">
                                <Input
                                  value={draft[column.field]}
                                  placeholder={
                                    column.field === 'sku' && !draft.sku ? '(otomatis)' : undefined
                                  }
                                  onChange={(event) =>
                                    setDraft({ ...draft, [column.field]: event.target.value })
                                  }
                                  className={cn('h-8 min-w-28', error && 'border-destructive')}
                                />
                                {error ? (
                                  <div className="text-destructive mt-1 text-xs">{error}</div>
                                ) : null}
                              </TableCell>
                            );
                          }

                          return (
                            <TableCell key={column.field} className="align-top">
                              <div
                                className={cn(
                                  'whitespace-nowrap',
                                  error && 'text-destructive',
                                  column.field === 'stock' &&
                                    res.status === 'update' &&
                                    rawValue.trim() &&
                                    'text-muted-foreground line-through',
                                )}
                                title={
                                  column.field === 'stock' &&
                                  res.status === 'update' &&
                                  rawValue.trim()
                                    ? 'Stok diabaikan untuk SKU yang sudah ada.'
                                    : undefined
                                }
                              >
                                {column.field === 'sku' && res.skuGenerated ? (
                                  <>
                                    {res.resolvedSku}
                                    <Badge
                                      variant="secondary"
                                      className="ml-1 px-1 py-0 text-[10px]"
                                    >
                                      auto
                                    </Badge>
                                  </>
                                ) : (
                                  rawValue || '—'
                                )}
                              </div>
                              {error ? (
                                <div className="text-destructive mt-1 text-xs">{error}</div>
                              ) : null}
                            </TableCell>
                          );
                        })}

                        {!readOnly ? (
                          <TableCell className="text-right align-top">
                            {editing ? (
                              <div className="flex justify-end gap-1">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={saveEdit}
                                >
                                  <Check className="size-4" />
                                  <span className="sr-only">Simpan</span>
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={cancelEdit}
                                >
                                  <X className="size-4" />
                                  <span className="sr-only">Batal</span>
                                </Button>
                              </div>
                            ) : (
                              <div className="flex justify-end gap-1">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  disabled={editingLine !== null}
                                  onClick={() => startEdit(res.line)}
                                >
                                  <Pencil className="size-4" />
                                  <span className="sr-only">Edit</span>
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  disabled={editingLine !== null}
                                  className="text-destructive focus-visible:text-destructive"
                                  onClick={() => deleteRow(res.line)}
                                >
                                  <Trash2 className="size-4" />
                                  <span className="sr-only">Hapus</span>
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        ) : null}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {readOnly ? 'Tutup' : 'Batal'}
          </Button>
          {!readOnly ? (
            <Button
              type="button"
              onClick={handleCommit}
              disabled={pending || resolving || actionable === 0 || editingLine !== null}
            >
              {pending ? 'Mengimpor…' : `Impor ${actionable} item`}
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SummaryBadge({
  tone,
  count,
  label,
  help,
}: {
  tone: StatusTone;
  count: number;
  label: string;
  help: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span>
          <StatusBadge tone={tone}>
            {count} {label}
          </StatusBadge>
        </span>
      </TooltipTrigger>
      <TooltipContent>{help}</TooltipContent>
    </Tooltip>
  );
}
