import { EXPENSE_CATEGORY_LABELS, type ExpenseListItem } from '../types';

const HEADERS = ['Tanggal', 'Kategori', 'Jumlah', 'Catatan'] as const;

/** Quote a field only when it contains a comma, quote, or newline (RFC 4180). */
function escapeCsv(value: string): string {
  if (/["\n\r,]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/** Serialize the expense ledger to CSV (CRLF line endings, for spreadsheets). */
export function expensesToCsv(expenses: ExpenseListItem[]): string {
  const lines = expenses.map((expense) =>
    [
      expense.date.slice(0, 10), // ISO → YYYY-MM-DD (spreadsheet-sortable)
      EXPENSE_CATEGORY_LABELS[expense.category],
      expense.amount,
      expense.note ?? '',
    ]
      .map(escapeCsv)
      .join(','),
  );

  return [HEADERS.join(','), ...lines].join('\r\n');
}
