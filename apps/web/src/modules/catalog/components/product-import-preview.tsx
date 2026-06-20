'use client';

import { useEffect, useMemo, useState } from 'react';
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
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
import { Switch } from '@/components/ui/switch';
import { TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { StatusBadge, type StatusTone } from '@/components/status-badge';
import { VirtualizedTable, type VirtualRowProps } from '@/components/virtualized-table';
import { cn } from '@/lib/utils';
import { inventoryKeys } from '@/modules/inventory/hooks/inventory-keys';

import { catalogKeys } from '../hooks/catalog-keys';
import { commitProductImport, fetchImportContext } from '../hooks/use-products';
import type {
  ProductImportField,
  ProductImportReport,
  ProductImportRowResult,
  ProductImportStatus,
  ProductImportSummary,
} from '../types';
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
const COLUMN_WIDTH: Record<string, number> = {
  productName: 180,
  category: 120,
  description: 220,
  variantGroup: 130,
  variantName: 160,
  sku: 160,
  price: 110,
  cost: 110,
  stock: 90,
};
const NUMERIC_FIELDS = new Set<ProductImportField>(['price', 'cost', 'stock']);

/** Above this many rows, virtualize the preview table so it stays smooth (up to ~2000). */
const VIRTUALIZE_THRESHOLD = 100;
/** Commit the import in sequential chunks — bounds each request + drives the progress bar. */
const COMMIT_BATCH_SIZE = 100;

function summarize(rows: ProductImportRowResult[]): ProductImportSummary {
  return {
    create: rows.filter((row) => row.status === 'create').length,
    update: rows.filter((row) => row.status === 'update').length,
    skip: rows.filter((row) => row.status === 'skip').length,
    error: rows.filter((row) => row.status === 'error').length,
    total: rows.length,
  };
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

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
  const queryClient = useQueryClient();
  const [committed, setCommitted] = useState<ProductImportReport | null>(null);
  const [editingLine, setEditingLine] = useState<number | null>(null);
  const [draft, setDraft] = useState<RawProductRow | null>(null);
  const [showErrorsOnly, setShowErrorsOnly] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

  // Any change to the source rows (an edit, a delete, a reupload) invalidates a prior commit result.
  useEffect(() => {
    setCommitted(null);
    setEditingLine(null);
    setDraft(null);
  }, [rows]);

  // Resolve which SKUs / product names already exist — re-fetched whenever the
  // effective SKU set or names change (so an edited or generated SKU is re-checked).
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

  useEffect(() => {
    if (summary.error === 0) setShowErrorsOnly(false);
  }, [summary.error]);

  // Error rows float to the top; the switch filters to just them.
  const sortedRows = useMemo(
    () =>
      [...displayRows].sort(
        (a, b) => (a.status === 'error' ? 0 : 1) - (b.status === 'error' ? 0 : 1),
      ),
    [displayRows],
  );
  const visibleRows = showErrorsOnly ? sortedRows.filter((r) => r.status === 'error') : sortedRows;
  const colSpan = 1 + PREVIEW_COLUMNS.length + (readOnly ? 0 : 1);

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
    setCommitting(true);
    setProgress({ done: 0, total: rows.length });
    const resultRows: ProductImportRowResult[] = [];
    let done = 0;

    try {
      for (const batch of chunk(rows, COMMIT_BATCH_SIZE)) {
        try {
          const result = await commitProductImport(rowsToImportCsv(batch));
          resultRows.push(...result.rows);
        } catch (batchError) {
          // A whole batch failed — mark its rows errored. Re-importing is safe: rows that
          // did commit become updates next time (matched by SKU), so nothing duplicates.
          const message = batchError instanceof Error ? batchError.message : 'Gagal mengimpor.';
          for (const row of batch) {
            const planned = plan.rows.find((p) => p.line === row.line);
            resultRows.push({
              line: row.line,
              status: 'error',
              resolvedSku: planned?.resolvedSku ?? (row.sku.trim() || null),
              skuGenerated: planned?.skuGenerated ?? false,
              productName: row.productName.trim(),
              variantName: row.variantName.trim(),
              fieldErrors: {},
              message,
            });
          }
        }
        done += batch.length;
        setProgress({ done, total: rows.length });
      }

      const summaryResult = summarize(resultRows);
      setCommitted({ committed: true, summary: summaryResult, rows: resultRows });
      void queryClient.invalidateQueries({ queryKey: catalogKeys.all });
      void queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
      toast.success('Impor selesai', {
        description: `${summaryResult.create} dibuat, ${summaryResult.update} diperbarui${
          summaryResult.error > 0 ? `, ${summaryResult.error} gagal` : ''
        }.`,
      });
    } finally {
      setCommitting(false);
      setProgress(null);
    }
  }

  const renderRow = (res: ProductImportRowResult, rowProps: VirtualRowProps) => {
    const rawRow = rawByLine.get(res.line);
    const editing = !readOnly && editingLine === res.line;
    const meta = STATUS_META[res.status];

    return (
      <TableRow {...rowProps}>
        <TableCell className="align-top">
          <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>
          {res.message ? (
            <div
              className={cn(
                'mt-1 text-xs',
                res.status === 'error' ? 'text-destructive' : 'text-muted-foreground',
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
                  placeholder={column.field === 'sku' && !draft.sku ? '(otomatis)' : undefined}
                  onChange={(event) => setDraft({ ...draft, [column.field]: event.target.value })}
                  className={cn('h-8 w-full', error && 'border-destructive')}
                />
                {error ? <div className="text-destructive mt-1 text-xs">{error}</div> : null}
              </TableCell>
            );
          }

          return (
            <TableCell key={column.field} className="align-top">
              {column.field === 'sku' && res.skuGenerated ? (
                <div className={cn('flex items-center gap-1', error && 'text-destructive')}>
                  <span className="truncate">{res.resolvedSku}</span>
                  <Badge variant="secondary" className="shrink-0 px-1 py-0 text-[10px]">
                    auto
                  </Badge>
                </div>
              ) : (
                <CellText
                  value={rawValue}
                  numeric={NUMERIC_FIELDS.has(field)}
                  className={cn(
                    error && 'text-destructive',
                    field === 'stock' &&
                      res.status === 'update' &&
                      rawValue.trim() &&
                      'text-muted-foreground line-through',
                  )}
                  title={
                    field === 'stock' && res.status === 'update' && rawValue.trim()
                      ? 'Stok diabaikan untuk SKU yang sudah ada.'
                      : undefined
                  }
                />
              )}
              {error ? <div className="text-destructive mt-1 text-xs">{error}</div> : null}
            </TableCell>
          );
        })}

        {!readOnly ? (
          <TableCell className="text-right align-top">
            {editing ? (
              <div className="flex justify-end gap-1">
                <Button type="button" variant="ghost" size="icon" onClick={saveEdit}>
                  <Check className="size-4" />
                  <span className="sr-only">Simpan</span>
                </Button>
                <Button type="button" variant="ghost" size="icon" onClick={cancelEdit}>
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
                  disabled={editingLine !== null || committing}
                  onClick={() => startEdit(res.line)}
                >
                  <Pencil className="size-4" />
                  <span className="sr-only">Edit</span>
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={editingLine !== null || committing}
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
  };

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
          <TooltipProvider delayDuration={300}>
            <div className="flex flex-wrap items-center justify-between gap-2">
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

              <div className="flex items-center gap-3">
                {summary.error > 0 ? (
                  <label className="flex cursor-pointer items-center gap-2 text-sm">
                    <Switch checked={showErrorsOnly} onCheckedChange={setShowErrorsOnly} />
                    Hanya error
                  </label>
                ) : null}
                {!readOnly ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={onReupload}
                    disabled={committing}
                  >
                    <RefreshCw className="size-4" />
                    Unggah ulang
                  </Button>
                ) : null}
              </div>
            </div>

            {committed ? (
              <div className="border-status-ok/30 bg-status-ok/10 text-status-ok mt-2 rounded-lg border px-3 py-2 text-sm">
                Impor selesai. {summary.create} produk dibuat, {summary.update} diperbarui
                {summary.error > 0 ? `, ${summary.error} gagal` : ''}.
              </div>
            ) : null}

            <div className="mt-2">
              <VirtualizedTable
                items={visibleRows}
                getKey={(res) => res.line}
                renderRow={renderRow}
                colSpan={colSpan}
                estimateRowHeight={56}
                virtualized={visibleRows.length > VIRTUALIZE_THRESHOLD}
                containerClassName="max-h-[55vh]"
                className="min-w-[1180px] table-fixed"
                header={
                  <TableHeader>
                    <TableRow>
                      <TableHead style={{ width: 92 }}>Status</TableHead>
                      {PREVIEW_COLUMNS.map((column) => (
                        <TableHead
                          key={column.field}
                          style={{ width: COLUMN_WIDTH[column.field] }}
                          className="whitespace-nowrap"
                        >
                          {column.header}
                          {column.required ? <span className="text-destructive">*</span> : null}
                        </TableHead>
                      ))}
                      {!readOnly ? (
                        <TableHead style={{ width: 84 }} className="text-right">
                          Aksi
                        </TableHead>
                      ) : null}
                    </TableRow>
                  </TableHeader>
                }
              />
            </div>
          </TooltipProvider>
        )}

        {committing && progress ? (
          <div className="space-y-1">
            <div className="text-muted-foreground text-xs">
              Mengimpor… {progress.done}/{progress.total}
            </div>
            <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
              <div
                className="bg-primary h-full rounded-full transition-all"
                style={{
                  width: `${progress.total ? Math.round((progress.done / progress.total) * 100) : 0}%`,
                }}
              />
            </div>
          </div>
        ) : null}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={committing}
          >
            {readOnly ? 'Tutup' : 'Batal'}
          </Button>
          {!readOnly ? (
            <Button
              type="button"
              onClick={handleCommit}
              disabled={committing || resolving || actionable === 0 || editingLine !== null}
            >
              {committing ? 'Mengimpor…' : `Impor ${actionable} item`}
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CellText({
  value,
  numeric,
  className,
  title,
}: {
  value: string;
  numeric?: boolean;
  className?: string;
  title?: string;
}) {
  if (!value) return <span className="text-muted-foreground">—</span>;
  if (numeric) {
    return (
      <div className={cn('num truncate', className)} title={title}>
        {value}
      </div>
    );
  }
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className={cn('truncate', className)} title={title}>
          {value}
        </div>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs break-words">{value}</TooltipContent>
    </Tooltip>
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
