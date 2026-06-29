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
