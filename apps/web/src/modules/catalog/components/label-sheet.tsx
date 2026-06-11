'use client';

import { formatCurrency } from '@/lib/formatters';

/**
 * The minimum a row needs to render a printable QR label. Both a `LabelVariant`
 * and a `BundleLabel` are adapted to this shape — `productName` is the optional
 * grouping prefix (a variant has one, a bundle does not). `id` keys the cell.
 */
export type PrintableLabel = {
  id: string;
  name: string;
  sku: string;
  barcode: string | null;
  /** Decimal serialized as a string to avoid float precision loss. */
  price: string;
  /** Optional prefix shown before the name (e.g. a variant's product name). */
  productName?: string;
};

/** The QR encodes the scannable code: a real barcode when present, else the SKU. */
export function labelCodeFor(label: Pick<PrintableLabel, 'barcode' | 'sku'>): string {
  return label.barcode?.trim() || label.sku;
}

/** Date-only id-ID stamp for the print footer (e.g. "11 Juni 2026"). */
const PRINT_STAMP_FORMAT = new Intl.DateTimeFormat('id-ID', { dateStyle: 'long' });

/** How many labels fit across a row — the knob that sizes each label. */
export type LabelColumns = 1 | 2 | 3 | 4;

/** Fewer columns = bigger labels: the QR scales up to fill the wider cell. */
const QR_SIZE_BY_COLUMNS: Record<LabelColumns, string> = {
  1: 'size-56',
  2: 'size-40',
  3: 'size-28',
  4: 'size-20',
};

function LabelCell({
  label,
  qr,
  qrSizeClass,
}: {
  label: PrintableLabel;
  qr: string | undefined;
  qrSizeClass: string;
}) {
  const code = labelCodeFor(label);

  return (
    <div className="flex break-inside-avoid flex-col items-center gap-1 rounded-md border p-2 text-center">
      <div className="line-clamp-2 text-[11px] leading-tight font-medium">
        {label.productName ? `${label.productName} · ${label.name}` : label.name}
      </div>
      {qr ? (
        // eslint-disable-next-line @next/next/no-img-element -- dynamic QR data URL
        <img src={qr} alt={code} className={qrSizeClass} />
      ) : (
        <div className={`bg-muted animate-pulse rounded ${qrSizeClass}`} />
      )}
      <div className="num text-muted-foreground text-[10px]">{label.sku}</div>
      <div className="num text-xs font-semibold">{formatCurrency(label.price)}</div>
    </div>
  );
}

/**
 * The printable A4 grid — one cell per selected label. `data-print-root` is the
 * single element revealed by the print stylesheet (globals.css `@media print`).
 * `columns` sizes the labels (fewer columns → bigger) on screen AND in print.
 */
export function LabelSheet({
  labels,
  qrCodes,
  columns = 4,
}: {
  labels: PrintableLabel[];
  qrCodes: Map<string, string>;
  columns?: LabelColumns;
}) {
  const qrSizeClass = QR_SIZE_BY_COLUMNS[columns];

  return (
    <div
      data-print-root
      className="grid gap-2 print:gap-1.5"
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    >
      {labels.map((label) => (
        <LabelCell
          key={label.id}
          label={label}
          qr={qrCodes.get(labelCodeFor(label))}
          qrSizeClass={qrSizeClass}
        />
      ))}
      <div className="text-muted-foreground col-span-full mt-3 flex items-baseline justify-between gap-2 border-t pt-2 text-[10px]">
        <span className="font-semibold">Falka</span>
        <span suppressHydrationWarning>dicetak {PRINT_STAMP_FORMAT.format(new Date())}</span>
      </div>
    </div>
  );
}
