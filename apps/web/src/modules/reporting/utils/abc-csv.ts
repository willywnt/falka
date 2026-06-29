import type { AbcRow } from '../types';

const HEADERS = [
  'SKU',
  'Name',
  'Class',
  'Revenue',
  'Units sold',
  'Revenue share %',
  'Cumulative share %',
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

/** Serialize ABC rows to CSV (CRLF line endings, for spreadsheets). */
export function abcToCsv(rows: AbcRow[]): string {
  const lines = rows.map((row) =>
    [
      row.sku,
      row.name,
      row.class,
      row.revenue,
      String(row.unitsSold),
      row.revenueSharePct == null ? '' : String(row.revenueSharePct),
      row.cumulativeSharePct == null ? '' : String(row.cumulativeSharePct),
    ]
      .map(escapeCsv)
      .join(','),
  );

  return [HEADERS.join(','), ...lines].join('\r\n');
}
