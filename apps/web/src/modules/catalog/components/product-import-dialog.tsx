'use client';

import { useRef, useState } from 'react';
import { Download, FileSpreadsheet, Loader2, UploadCloud } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { StatusBadge, type StatusTone } from '@/components/status-badge';
import { cn } from '@/lib/utils';

import { productsTemplateUrl, useImportProductsMutation } from '../hooks/use-products';
import type { ProductImportReport, ProductImportStatus } from '../types';
import { PRODUCT_CSV_COLUMNS } from '../utils/product-csv';

const STATUS_META: Record<ProductImportStatus, { tone: StatusTone; label: string }> = {
  create: { tone: 'info', label: 'Buat' },
  update: { tone: 'ok', label: 'Perbarui' },
  skip: { tone: 'neutral', label: 'Lewati' },
  error: { tone: 'danger', label: 'Error' },
};

/** Read a dropped/picked file into CSV text — parses .xlsx/.xls client-side. */
async function fileToCsv(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
    const XLSX = await import('xlsx');
    const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' });
    const firstSheet = workbook.SheetNames[0];
    const sheet = firstSheet ? workbook.Sheets[firstSheet] : undefined;
    if (!sheet) throw new Error('File Excel tidak punya sheet.');
    return XLSX.utils.sheet_to_csv(sheet);
  }
  return file.text();
}

export function ProductImportDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [csv, setCsv] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [report, setReport] = useState<ProductImportReport | null>(null);
  const [dragging, setDragging] = useState(false);
  const importMutation = useImportProductsMutation();

  function reset() {
    setCsv(null);
    setFileName(null);
    setReport(null);
    setDragging(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function handleFile(file: File) {
    setFileName(file.name);
    setReport(null);
    let text: string;
    try {
      text = await fileToCsv(file);
    } catch (error) {
      toast.error('Gagal membaca file', {
        description:
          error instanceof Error ? error.message : 'Pastikan file .xlsx atau .csv valid.',
      });
      return;
    }
    setCsv(text);
    try {
      const preview = await importMutation.mutateAsync({ csv: text, commit: false });
      setReport(preview);
    } catch (error) {
      setCsv(null);
      toast.error('Gagal memeriksa file', {
        description: error instanceof Error ? error.message : 'Terjadi kesalahan',
      });
    }
  }

  async function handleConfirm() {
    if (!csv) return;
    try {
      const result = await importMutation.mutateAsync({ csv, commit: true });
      setReport(result);
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

  const actionable = report ? report.summary.create + report.summary.update : 0;
  const committed = report?.committed ?? false;
  const pending = importMutation.isPending;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-h-[90vh] !max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Impor produk</DialogTitle>
          <DialogDescription>
            Unggah file Excel (.xlsx) atau CSV untuk membuat produk baru, atau memperbarui
            harga/modal/nama varian berdasarkan SKU. Stok hanya diisi untuk varian baru.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void handleFile(file);
            }}
          />

          {/* Compact, draggable dropzone. */}
          <div
            role="button"
            tabIndex={0}
            aria-disabled={pending}
            onClick={() => {
              if (!pending) fileInputRef.current?.click();
            }}
            onKeyDown={(event) => {
              if ((event.key === 'Enter' || event.key === ' ') && !pending) {
                event.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            onDragOver={(event) => {
              event.preventDefault();
              if (!pending) setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragging(false);
              const file = event.dataTransfer.files?.[0];
              if (file && !pending) void handleFile(file);
            }}
            className={cn(
              'mx-auto flex max-w-md cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-6 py-8 text-center transition-colors',
              dragging ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/40',
              pending && 'pointer-events-none opacity-60',
            )}
          >
            <UploadCloud className="text-muted-foreground size-7" />
            <div className="text-sm font-medium">Tarik file ke sini atau klik untuk pilih</div>
            <div className="text-muted-foreground text-xs">Format .xlsx (disarankan) atau .csv</div>
            {fileName ? (
              <div className="text-foreground mt-1 inline-flex items-center gap-1.5 text-xs">
                <FileSpreadsheet className="size-3.5" />
                {fileName}
              </div>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <Button type="button" variant="outline" size="sm" asChild>
              <a href={productsTemplateUrl()} download>
                <Download className="size-4" />
                Unduh template
              </a>
            </Button>
            <p className="text-muted-foreground text-xs">
              Kolom wajib:{' '}
              {PRODUCT_CSV_COLUMNS.filter((column) => column.required).map((column, index) => (
                <span key={column.field}>
                  {index > 0 ? ', ' : ''}
                  {column.header}
                  <span className="text-destructive">*</span>
                </span>
              ))}
              . Kosongkan SKU untuk produk baru.
            </p>
          </div>

          {pending && !report ? (
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <Loader2 className="size-4 animate-spin" />
              Memeriksa file…
            </div>
          ) : null}

          {report ? (
            <>
              <div className="flex flex-wrap gap-2">
                <StatusBadge tone="info">{report.summary.create} buat</StatusBadge>
                <StatusBadge tone="ok">{report.summary.update} perbarui</StatusBadge>
                <StatusBadge tone="neutral">{report.summary.skip} lewati</StatusBadge>
                {report.summary.error > 0 ? (
                  <StatusBadge tone="danger">{report.summary.error} error</StatusBadge>
                ) : null}
              </div>

              {committed ? (
                <div className="border-status-ok/30 bg-status-ok/10 text-status-ok rounded-lg border px-3 py-2 text-sm">
                  Impor selesai. {report.summary.create} produk dibuat, {report.summary.update}{' '}
                  diperbarui
                  {report.summary.error > 0 ? `, ${report.summary.error} gagal` : ''}.
                </div>
              ) : null}

              <div className="max-h-[40vh] overflow-auto rounded-xl border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-14">Baris</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Produk / Varian</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Catatan</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.rows.map((row) => {
                      const meta = STATUS_META[row.status];
                      return (
                        <TableRow key={row.line}>
                          <TableCell className="num text-muted-foreground">{row.line}</TableCell>
                          <TableCell>
                            <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{row.productName || '—'}</div>
                            {row.variantName ? (
                              <div className="text-muted-foreground text-xs">{row.variantName}</div>
                            ) : null}
                          </TableCell>
                          <TableCell className="font-mono text-xs">{row.sku ?? '—'}</TableCell>
                          <TableCell
                            className={
                              row.status === 'error'
                                ? 'text-destructive text-xs'
                                : 'text-muted-foreground text-xs'
                            }
                          >
                            {row.message ?? '—'}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </>
          ) : null}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {committed ? 'Tutup' : 'Batal'}
          </Button>
          {report && !committed ? (
            <Button type="button" disabled={pending || actionable === 0} onClick={handleConfirm}>
              {pending ? 'Mengimpor…' : `Impor ${actionable} item`}
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
