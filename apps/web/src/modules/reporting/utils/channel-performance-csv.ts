import type { ChannelPerformanceRow } from '../types';
import { channelLabel } from './channel-label';

const HEADERS = [
  'Channel',
  'Net revenue',
  'Revenue share %',
  'COGS',
  'Gross profit',
  'Gross margin %',
  'Units sold',
  'Transactions',
  'Avg order value',
  'Refunded revenue',
  'Return rate %',
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

/** Serialize per-channel performance rows to CSV (CRLF line endings). */
export function channelPerformanceToCsv(rows: ChannelPerformanceRow[]): string {
  const lines = rows.map((row) =>
    [
      channelLabel(row.channel),
      row.grossRevenue,
      row.revenueSharePct === null ? '' : String(row.revenueSharePct),
      row.cogs,
      row.grossProfit,
      row.grossMarginPct === null ? '' : String(row.grossMarginPct),
      String(row.unitsSold),
      String(row.transactions),
      row.avgOrderValue,
      row.refundedRevenue,
      row.returnRatePct === null ? '' : String(row.returnRatePct),
      String(row.costUnknownLines),
    ]
      .map(escapeCsv)
      .join(','),
  );

  return [HEADERS.join(','), ...lines].join('\r\n');
}
