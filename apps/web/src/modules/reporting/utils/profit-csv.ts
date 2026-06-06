import type { ProfitBySku } from '../types';

const HEADERS = [
  'SKU',
  'Product',
  'Units sold',
  'Gross revenue',
  'Revenue (cost known)',
  'COGS',
  'Gross profit',
  'Gross margin %',
  'Cost-unknown lines',
] as const;

/** Quote a field only when it contains a comma, quote, or newline (RFC 4180). */
function escapeCsv(value: string): string {
  if (/["\n\r,]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/** Serialize per-SKU profit rows to CSV (CRLF line endings, for spreadsheet tools). */
export function profitBySkuToCsv(rows: ProfitBySku[]): string {
  const lines = rows.map((row) =>
    [
      row.sku,
      row.name,
      String(row.unitsSold),
      row.grossRevenue,
      row.costKnownRevenue,
      row.cogs,
      row.grossProfit,
      row.grossMarginPct === null ? '' : String(row.grossMarginPct),
      String(row.costUnknownLines),
    ]
      .map(escapeCsv)
      .join(','),
  );

  return [HEADERS.join(','), ...lines].join('\r\n');
}
