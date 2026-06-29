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

/** Neutralize spreadsheet formula sigils (CSV injection) then RFC-4180-quote when needed. */
function escapeCsv(value: string): string {
  // A leading = + - @ (or tab/CR) makes Excel/Sheets treat the cell as a formula on open; prefix a
  // `'` so it renders literally. Plain (optionally-signed) numbers are exempt so numeric columns
  // keep their sign. https://owasp.org/www-community/attacks/CSV_Injection
  const isPlainNumber = /^-?\d+(\.\d+)?$/.test(value);
  const safe = !isPlainNumber && /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  if (/["\n\r,]/.test(safe)) {
    return `"${safe.replace(/"/g, '""')}"`;
  }
  return safe;
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
