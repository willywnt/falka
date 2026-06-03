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

/** Quote a field only when it contains a comma, quote, or newline (RFC 4180). */
function escapeCsv(value: string): string {
  if (/["\n\r,]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
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
