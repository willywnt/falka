import { describe, expect, it } from 'vitest';

import type { ExpenseListItem } from '@/modules/finance/types';
import { expensesToCsv } from '@/modules/finance/utils/expense-csv';

function item(overrides: Partial<ExpenseListItem> = {}): ExpenseListItem {
  return {
    id: 'e1',
    category: 'ADVERTISING',
    amount: '150000',
    date: '2026-06-05T00:00:00.000Z',
    note: 'FB ads',
    createdAt: '2026-06-05T01:00:00.000Z',
    ...overrides,
  };
}

describe('expensesToCsv', () => {
  it('emits the header, maps the category label, and slices the ISO date', () => {
    const [header, row] = expensesToCsv([item()]).split('\r\n');
    expect(header).toBe('Tanggal,Kategori,Jumlah,Catatan');
    expect(row).toBe('2026-06-05,Iklan,150000,FB ads');
  });

  it('escapes commas/quotes in the note and blanks a null note', () => {
    const rows = expensesToCsv([
      item({ note: 'iklan, "promo"' }),
      item({ id: 'e2', category: 'RENT', note: null }),
    ])
      .split('\r\n')
      .slice(1);
    expect(rows[0]).toBe('2026-06-05,Iklan,150000,"iklan, ""promo"""');
    expect(rows[1]).toBe('2026-06-05,Sewa,150000,');
  });

  it('returns a header-only string for an empty ledger', () => {
    expect(expensesToCsv([])).toBe('Tanggal,Kategori,Jumlah,Catatan');
  });
});
