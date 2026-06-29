import type { InventoryValuationProduct } from '../types';

const HEADERS = [
  'Product',
  'Category',
  'Variants',
  'Available units',
  'Stock value',
  'Missing-cost variants',
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

/** Serialize per-product valuation rows to CSV (CRLF line endings, for spreadsheets). */
export function inventoryValuationToCsv(rows: InventoryValuationProduct[]): string {
  const lines = rows.map((row) =>
    [
      row.productName,
      row.category ?? '',
      String(row.variantCount),
      String(row.availableUnits),
      row.stockValue,
      String(row.costUnknownVariants),
    ]
      .map(escapeCsv)
      .join(','),
  );

  return [HEADERS.join(','), ...lines].join('\r\n');
}
