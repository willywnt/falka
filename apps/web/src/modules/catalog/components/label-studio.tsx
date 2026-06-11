'use client';

import { useEffect, useMemo, useState } from 'react';
import { Check, Printer, QrCode } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/empty-state';
import { ImageThumb } from '@/components/image-thumb';
import { TablePagination } from '@/components/table-pagination';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { usePagination } from '@/hooks/use-pagination';
import { formatCurrency, formatRelativeTime } from '@/lib/formatters';
import { cn } from '@/lib/utils';

import { useLabelVariantsQuery, useMarkLabelsPrintedMutation } from '../hooks/use-products';
import { useQrCodes } from '../hooks/use-qr-codes';
import type { LabelVariant } from '../types';
import { LabelSheet, labelCodeFor, type PrintableLabel } from './label-sheet';

/**
 * Phase A of POS QR-scan: pick variants and print an A4 sheet of QR labels
 * (each encodes `barcode ?? sku`). Pure client render — no new tables. Selection
 * is held as a Map so picks survive search changes that filter a row out of view.
 */
export function LabelStudio() {
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebouncedValue(searchInput.trim(), 300);
  const { page, setPage, pageSize, setPageSize } = usePagination(10);
  const { data: results, isLoading } = useLabelVariantsQuery(debouncedSearch, page, pageSize);

  // A new search resets to the first page.
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, setPage]);

  const [selected, setSelected] = useState<Map<string, LabelVariant>>(new Map());
  const picked = useMemo(() => [...selected.values()], [selected]);
  const labels = useMemo<PrintableLabel[]>(
    () =>
      picked.map((variant) => ({
        id: variant.variantId,
        name: variant.name,
        sku: variant.sku,
        barcode: variant.barcode,
        price: variant.price,
        // The label shows the variant label (group · name / name), not the product.
        productName: variant.variantGroup ?? undefined,
      })),
    [picked],
  );
  const codeValues = useMemo(() => labels.map(labelCodeFor), [labels]);
  const qrCodes = useQrCodes(codeValues);
  const qrReady = codeValues.every((value) => qrCodes.has(value));
  const markPrinted = useMarkLabelsPrintedMutation();

  const variants = results?.items ?? [];
  const meta = results?.meta;

  function handlePrint() {
    if (labels.length === 0 || !qrReady) return;
    // Stamp the printed time so the picker flags these as already printed.
    markPrinted.mutate(picked.map((variant) => variant.variantId));
    window.print();
  }

  function toggle(variant: LabelVariant) {
    setSelected((prev) => {
      const next = new Map(prev);
      if (next.has(variant.variantId)) next.delete(variant.variantId);
      else next.set(variant.variantId, variant);
      return next;
    });
  }

  function selectPage() {
    setSelected((prev) => {
      const next = new Map(prev);
      for (const variant of variants) next.set(variant.variantId, variant);
      return next;
    });
  }

  function clearAll() {
    setSelected(new Map());
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <Input
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder="Cari nama produk, varian, atau sku..."
          className="sm:max-w-xs"
        />
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={selectPage} disabled={variants.length === 0}>
            Pilih halaman ini
          </Button>
          <Button variant="outline" onClick={clearAll} disabled={selected.size === 0}>
            Bersihkan ({selected.size})
          </Button>
          <Button onClick={handlePrint} disabled={labels.length === 0 || !qrReady}>
            <Printer className="size-4" />
            Cetak
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
        <Card className="print:hidden">
          <CardHeader>
            <CardTitle className="text-base">
              Varian
              {meta ? (
                <span className="text-muted-foreground font-normal"> · {meta.total}</span>
              ) : null}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 6 }).map((_, index) => (
                  <Skeleton key={index} className="h-12 w-full" />
                ))}
              </div>
            ) : variants.length === 0 ? (
              <p className="text-muted-foreground py-6 text-center text-sm">
                {debouncedSearch
                  ? 'Tidak ada varian yang cocok.'
                  : 'Tidak ada varian aktif untuk dilabeli.'}
              </p>
            ) : (
              <ul className="divide-y rounded-lg border">
                {variants.map((variant) => {
                  const isSelected = selected.has(variant.variantId);
                  return (
                    <li key={variant.variantId}>
                      <button
                        type="button"
                        onClick={() => toggle(variant)}
                        aria-pressed={isSelected}
                        className="hover:bg-accent/50 flex w-full items-center gap-3 px-3 py-2 text-left transition-colors"
                      >
                        <span
                          className={cn(
                            'flex size-4 shrink-0 items-center justify-center rounded border',
                            isSelected
                              ? 'border-primary bg-primary text-primary-foreground'
                              : 'border-input',
                          )}
                        >
                          {isSelected ? <Check className="size-3" /> : null}
                        </span>
                        <ImageThumb src={variant.imageUrl} alt={variant.name} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium">
                            {variant.productName} · {variant.name}
                          </span>
                          <span className="text-muted-foreground block truncate text-xs">
                            {labelCodeFor(variant)} · {formatCurrency(variant.price)}
                          </span>
                          {variant.labelPrintedAt ? (
                            <span
                              className="text-status-warn block truncate text-[11px]"
                              suppressHydrationWarning
                            >
                              Dicetak {formatRelativeTime(variant.labelPrintedAt)}
                            </span>
                          ) : null}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}

            {meta && meta.total > 0 ? (
              <TablePagination
                page={meta.page}
                pageSize={pageSize}
                total={meta.total}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
              />
            ) : null}
          </CardContent>
        </Card>

        <div>
          {labels.length === 0 ? (
            <EmptyState
              icon={QrCode}
              title="Belum ada label dipilih"
              description="Pilih varian di sebelah kiri untuk menyusun lembar label yang bisa dicetak."
              className="print:hidden"
            />
          ) : (
            <LabelSheet labels={labels} qrCodes={qrCodes} />
          )}
        </div>
      </div>
    </div>
  );
}
