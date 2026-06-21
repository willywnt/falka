'use client';

import { useRef, useState } from 'react';
import { Loader2, UploadCloud } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

import { productsTemplateUrl } from '../hooks/use-products';
import { tableToRawRows, type RawProductRow } from '../utils/parse-products-csv';
import { MAX_IMPORT_ROWS } from '../utils/product-csv';
import { ProductImportPreview } from './product-import-preview';

const ACCEPTED_EXTENSIONS = ['.xlsx', '.xls'];

/** Parse an uploaded .xlsx/.xls into canonical rows (header validation included). */
async function parseXlsx(file: File): Promise<{ rows?: RawProductRow[]; error?: string }> {
  const XLSX = await import('xlsx');
  const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' });
  const firstSheet = workbook.SheetNames[0];
  const sheet = firstSheet ? workbook.Sheets[firstSheet] : undefined;
  if (!sheet) return { error: 'File Excel tidak punya sheet.' };

  const table = XLSX.utils.sheet_to_json<string[]>(sheet, {
    header: 1,
    raw: false,
    defval: '',
  });
  const parsed = tableToRawRows(table);
  if (parsed.error) return { error: parsed.error };
  if (parsed.rows.length === 0) return { error: 'Tidak ada baris data di file.' };
  return { rows: parsed.rows };
}

export function ProductImportDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<'upload' | 'preview'>('upload');
  const [rows, setRows] = useState<RawProductRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  function handleClose(next: boolean) {
    if (!next) {
      setPhase('upload');
      setRows([]);
      setBusy(false);
      setError(null);
      setDragging(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
    onOpenChange(next);
  }

  async function handleFile(file: File) {
    setError(null);

    const name = file.name.toLowerCase();
    if (!ACCEPTED_EXTENSIONS.some((ext) => name.endsWith(ext))) {
      setError('Format tidak didukung. Hanya file .xlsx atau .xls.');
      return;
    }

    setBusy(true);
    const parsed: { rows?: RawProductRow[]; error?: string } = await parseXlsx(file).catch(() => ({
      error: 'Gagal membaca file. Pastikan formatnya .xlsx atau .xls.',
    }));
    setBusy(false);
    if (parsed.error || !parsed.rows) {
      setError(parsed.error ?? 'Gagal membaca file.');
      return;
    }
    if (parsed.rows.length > MAX_IMPORT_ROWS) {
      setError(
        `Terlalu banyak baris (${parsed.rows.length}). Maksimum ${MAX_IMPORT_ROWS} baris per impor.`,
      );
      return;
    }
    setRows(parsed.rows);
    setPhase('preview');
  }

  return (
    <>
      <Dialog open={open && phase === 'upload'} onOpenChange={handleClose}>
        <DialogContent className="!max-w-md">
          <DialogHeader>
            <DialogTitle>Impor produk</DialogTitle>
            <DialogDescription>
              Unggah file Excel (.xlsx/.xls, maks {MAX_IMPORT_ROWS} baris) untuk membuat produk baru
              atau memperbarui harga/modal/nama varian berdasarkan SKU.
            </DialogDescription>
          </DialogHeader>

          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = ''; // allow re-selecting the same file after a fix
              if (file) void handleFile(file);
            }}
          />

          <div
            role="button"
            tabIndex={0}
            aria-disabled={busy}
            onClick={() => {
              if (!busy) fileInputRef.current?.click();
            }}
            onKeyDown={(event) => {
              if ((event.key === 'Enter' || event.key === ' ') && !busy) {
                event.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            onDragOver={(event) => {
              event.preventDefault();
              if (!busy) setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragging(false);
              const file = event.dataTransfer.files?.[0];
              if (file && !busy) void handleFile(file);
            }}
            className={cn(
              'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-6 py-10 text-center transition-colors',
              dragging ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/40',
              busy && 'pointer-events-none opacity-60',
            )}
          >
            {busy ? (
              <Loader2 className="text-muted-foreground size-7 animate-spin" />
            ) : (
              <UploadCloud className="text-muted-foreground size-7" />
            )}
            <div className="text-sm font-medium">
              {busy ? 'Memproses…' : 'Tarik file ke sini atau klik untuk pilih'}
            </div>
            <div className="text-muted-foreground text-xs">
              File .xlsx atau .xls · maks {MAX_IMPORT_ROWS} baris
            </div>
          </div>

          {error ? <p className="text-destructive text-center text-sm">{error}</p> : null}

          <a
            href={productsTemplateUrl()}
            download
            className="text-primary mx-auto text-sm font-medium underline-offset-4 hover:underline"
          >
            Unduh template
          </a>
        </DialogContent>
      </Dialog>

      <ProductImportPreview
        open={open && phase === 'preview'}
        onOpenChange={handleClose}
        rows={rows}
        setRows={setRows}
        onReupload={() => setPhase('upload')}
      />
    </>
  );
}
