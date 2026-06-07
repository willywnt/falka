import type { InventoryValuationProduct } from '../types';

const HEADERS = [
  'Product',
  'Category',
  'Variants',
  'Available units',
  'Stock value',
  'Missing-cost variants',
] as const;

/** Quote a field only when it contains a comma, quote, or newline (RFC 4180). */
function escapeCsv(value: string): string {
  if (/["\n\r,]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
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
