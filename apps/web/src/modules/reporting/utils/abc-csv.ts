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

/** Quote a field only when it contains a comma, quote, or newline (RFC 4180). */
function escapeCsv(value: string): string {
  if (/["\n\r,]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
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
