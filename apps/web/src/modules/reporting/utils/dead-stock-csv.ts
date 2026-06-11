import type { DeadStockRow } from '../types';

const HEADERS = [
  'Product',
  'Variant',
  'Group',
  'SKU',
  'Available',
  'Unit cost',
  'Stock value',
  'Days idle',
  'Last sold (days ago)',
  'Status',
] as const;

/** Quote a field only when it contains a comma, quote, or newline (RFC 4180). */
function escapeCsv(value: string): string {
  if (/["\n\r,]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/** Serialize dead-stock rows to CSV (CRLF line endings, for spreadsheets). */
export function deadStockToCsv(rows: DeadStockRow[]): string {
  const lines = rows.map((row) =>
    [
      row.productName,
      row.variantName,
      row.variantGroup ?? '',
      row.sku,
      String(row.available),
      row.cost ?? '',
      row.stockValue,
      String(row.idleDays),
      row.daysSinceLastSale == null ? 'never' : String(row.daysSinceLastSale),
      row.status,
    ]
      .map(escapeCsv)
      .join(','),
  );

  return [HEADERS.join(','), ...lines].join('\r\n');
}
