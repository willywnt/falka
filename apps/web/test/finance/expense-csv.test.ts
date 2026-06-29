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
    source: 'MANUAL',
    createdAt: '2026-06-05T01:00:00.000Z',
    ...overrides,
  };
}

describe('expensesToCsv', () => {
  it('emits the header, maps the category label, slices the date, labels the source', () => {
    const [header, row] = expensesToCsv([item()]).split('\r\n');
    expect(header).toBe('Tanggal,Kategori,Jumlah,Catatan,Sumber');
    expect(row).toBe('2026-06-05,Iklan,150000,FB ads,Manual');
  });

  it('labels recurring + auto-derived sources', () => {
    const rows = expensesToCsv([
      item({ source: 'RECURRING' }),
      item({ id: 'e2', category: 'PAYMENT_FEE', source: 'AUTO_FEE' }),
    ])
      .split('\r\n')
      .slice(1);
    expect(rows[0]).toBe('2026-06-05,Iklan,150000,FB ads,Berulang');
    expect(rows[1]).toBe('2026-06-05,Biaya admin/QRIS,150000,FB ads,Otomatis');
  });

  it('escapes commas/quotes in the note and blanks a null note', () => {
    const rows = expensesToCsv([
      item({ note: 'iklan, "promo"' }),
      item({ id: 'e2', category: 'RENT', note: null }),
    ])
      .split('\r\n')
      .slice(1);
    expect(rows[0]).toBe('2026-06-05,Iklan,150000,"iklan, ""promo""",Manual');
    expect(rows[1]).toBe('2026-06-05,Sewa,150000,,Manual');
  });

  it('returns a header-only string for an empty ledger', () => {
    expect(expensesToCsv([])).toBe('Tanggal,Kategori,Jumlah,Catatan,Sumber');
  });

  it('neutralizes a leading formula sigil (CSV injection) in the note', () => {
    const rows = expensesToCsv([
      item({ note: '=SUM(A1:A9)' }),
      item({ id: 'e2', note: '@cmd' }),
      item({ id: 'e3', note: '+1+1' }),
      item({ id: 'e4', note: '-2+3' }),
    ])
      .split('\r\n')
      .slice(1);
    // Prefixed with a ' so Excel/Sheets shows the value literally instead of evaluating it.
    expect(rows[0]).toBe("2026-06-05,Iklan,150000,'=SUM(A1:A9),Manual");
    expect(rows[1]).toBe("2026-06-05,Iklan,150000,'@cmd,Manual");
    expect(rows[2]).toBe("2026-06-05,Iklan,150000,'+1+1,Manual");
    expect(rows[3]).toBe("2026-06-05,Iklan,150000,'-2+3,Manual");
  });

  it('prefixes AND quotes a formula value that also contains a comma', () => {
    const row = expensesToCsv([item({ note: '=A1,B1' })]).split('\r\n')[1];
    expect(row).toBe(`2026-06-05,Iklan,150000,"'=A1,B1",Manual`);
  });
});
