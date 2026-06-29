import { EXPENSE_CATEGORY_LABELS, EXPENSE_SOURCE_LABELS, type ExpenseListItem } from '../types';

const HEADERS = ['Tanggal', 'Kategori', 'Jumlah', 'Catatan', 'Sumber'] as const;

function sourceLabel(source: ExpenseListItem['source']): string {
  return source === 'MANUAL' ? 'Manual' : EXPENSE_SOURCE_LABELS[source];
}

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

/** Serialize the expense ledger to CSV (CRLF line endings, for spreadsheets). */
export function expensesToCsv(expenses: ExpenseListItem[]): string {
  const lines = expenses.map((expense) =>
    [
      expense.date.slice(0, 10), // ISO → YYYY-MM-DD (spreadsheet-sortable)
      EXPENSE_CATEGORY_LABELS[expense.category],
      expense.amount,
      expense.note ?? '',
      sourceLabel(expense.source),
    ]
      .map(escapeCsv)
      .join(','),
  );

  return [HEADERS.join(','), ...lines].join('\r\n');
}
