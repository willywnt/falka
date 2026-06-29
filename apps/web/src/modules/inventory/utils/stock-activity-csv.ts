import type { StockActivityItem } from '../types';
import { stockReasonLabel } from './reason-display';

const HEADERS = [
  'Date',
  'Product',
  'Variant',
  'SKU',
  'Reason',
  'Source',
  'Delta',
  'Balance after',
  'Reference',
  'Note',
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

/** Serialize activity rows to CSV (CRLF line endings, for spreadsheet tools). */
export function stockActivityToCsv(items: StockActivityItem[]): string {
  const rows = items.map((item) =>
    [
      item.createdAt,
      item.productName,
      item.variantName,
      item.sku,
      stockReasonLabel(item.reason),
      item.source,
      String(item.delta),
      String(item.balanceAfter),
      item.referenceId ?? '',
      item.note ?? '',
    ]
      .map(escapeCsv)
      .join(','),
  );

  return [HEADERS.join(','), ...rows].join('\r\n');
}
