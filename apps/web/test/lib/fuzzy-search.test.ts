import { describe, expect, it } from 'vitest';

import {
  compareMatches,
  scoreEntry,
  toHighlightSegments,
  toSearchable,
  type SearchField,
} from '@/lib/search/fuzzy-search';

/**
 * The command palette's homegrown fuzzy matcher (§13 — no search library).
 * These lock the tier ladder, the synonym cap, AND-token semantics, the
 * worst-tier-wins rule, and title-only highlight spans.
 */

function nav(
  title: string,
  keywords: readonly string[],
  section = '',
): ReturnType<typeof toSearchable> {
  const fields: SearchField[] = keywords.map((text) => ({ text, weight: 1 }));
  if (section) fields.push({ text: section, weight: 0.5 });
  return toSearchable(title, fields);
}

const kasir = nav(
  'Kasir (POS)',
  ['kasir', 'pos', 'penjualan', 'jual', 'struk', 'offline'],
  'Jualan',
);
const restok = nav('Saran restok', ['restok', 'reorder', 'saran', 'menipis', 'habis'], 'Stok');
const inventaris = nav('Inventaris', ['inventaris', 'stok', 'gudang', 'sisa'], 'Stok');
const pesanan = nav('Pesanan online', ['pesanan', 'order', 'resi', 'kirim'], 'Jualan');

describe('scoreEntry — tier ladder', () => {
  it('exact title match → exact tier', () => {
    expect(scoreEntry('inventaris', inventaris)?.tier).toBe('exact');
  });

  it('title prefix → prefix tier', () => {
    expect(scoreEntry('inven', inventaris)?.tier).toBe('prefix');
  });

  it('a later word starting with the token → word-prefix tier', () => {
    // No keyword helps, so the title's second word carries the match.
    expect(scoreEntry('harian', nav('Laporan harian', []))?.tier).toBe('word-prefix');
  });

  it('mid-word substring → substring tier', () => {
    expect(scoreEntry('poran', nav('Laporan harian', []))?.tier).toBe('substring');
  });

  it('acronyms of the leading words → acronym tier', () => {
    expect(scoreEntry('kp', nav('Kasir (POS)', []))?.tier).toBe('acronym');
    expect(scoreEntry('sr', nav('Saran restok', []))?.tier).toBe('acronym');
  });

  it('out-of-order / skipped letters → subsequence tier (typo tolerant)', () => {
    expect(scoreEntry('mrkt', nav('Marketplace', []))?.tier).toBe('subsequence');
  });

  it('no match anywhere → null', () => {
    expect(scoreEntry('zzzqqq', inventaris)).toBeNull();
  });
});

describe('scoreEntry — acronym guard', () => {
  it('a 2-char token matches the leading-word initials', () => {
    expect(scoreEntry('po', nav('Pesanan online', []))?.tier).toBe('acronym');
  });

  it('tokens longer than 3 chars never report the acronym tier (only ≤3 are candidates)', () => {
    // "kpos" can still resolve loosely via subsequence, but never as an acronym.
    expect(scoreEntry('kpos', nav('Kasir (POS)', []))?.tier).not.toBe('acronym');
  });
});

describe('scoreEntry — AND token semantics & worst-tier-wins', () => {
  it('every token must match or the whole entry drops out', () => {
    expect(scoreEntry('kasir zzz', kasir)).toBeNull();
    expect(scoreEntry('kasir jual', kasir)).not.toBeNull();
  });

  it('the whole-match tier is the worst tier among tokens', () => {
    // "saran" is a title prefix (rich); "rstk" only subsequence-matches "restok".
    expect(scoreEntry('saran rstk', nav('Saran restok', []))?.tier).toBe('subsequence');
  });

  it('does not regress the old substring matcher (every token as a plain substring still matches)', () => {
    expect(scoreEntry('pos', kasir)).not.toBeNull();
    expect(scoreEntry('saran', restok)).not.toBeNull();
    expect(scoreEntry('order', pesanan)).not.toBeNull();
  });
});

describe('scoreEntry — synonyms & typos', () => {
  it('an alias-only hit is capped at substring tier (never claims exact)', () => {
    // "invoice" matches nothing directly; its synonym "struk"/"penjualan" are
    // exact keywords on Kasir, but as synonyms they cap at substring.
    const result = scoreEntry('invoice', kasir);
    expect(result).not.toBeNull();
    expect(result?.tier).toBe('substring');
  });

  it('a common typo still lands on the right entry', () => {
    expect(scoreEntry('pesnan', pesanan)).not.toBeNull();
    expect(scoreEntry('inventori', inventaris)).not.toBeNull();
  });
});

describe('scoreEntry — title spans', () => {
  it('spans are half-open ranges into the original-cased title', () => {
    expect(scoreEntry('inven', inventaris)?.titleSpans).toEqual([[0, 5]]);
    expect(scoreEntry('ven', inventaris)?.titleSpans).toEqual([[2, 5]]);
  });

  it('a keyword-only hit yields no title spans (honest — nothing visible matched)', () => {
    const result = scoreEntry('jual', kasir);
    expect(result).not.toBeNull();
    expect(result?.titleSpans).toEqual([]);
  });
});

describe('compareMatches', () => {
  it('orders richer tiers first, then by raw score', () => {
    const exact = scoreEntry('inventaris', inventaris);
    const prefix = scoreEntry('inven', inventaris);
    const sub = scoreEntry('ven', inventaris);
    expect(exact && prefix && compareMatches(exact, prefix)).toBeLessThan(0);
    expect(prefix && sub && compareMatches(prefix, sub)).toBeLessThan(0);
    expect(sub && prefix && compareMatches(sub, prefix)).toBeGreaterThan(0);
  });
});

describe('toHighlightSegments', () => {
  it('returns one plain segment when there are no spans', () => {
    expect(toHighlightSegments('Kasir', [])).toEqual([{ text: 'Kasir', marked: false }]);
  });

  it('returns nothing for empty text', () => {
    expect(toHighlightSegments('', [])).toEqual([]);
  });

  it('wraps only the matched range', () => {
    expect(toHighlightSegments('Kasir', [[0, 2]])).toEqual([
      { text: 'Ka', marked: true },
      { text: 'sir', marked: false },
    ]);
  });

  it('merges adjacent/overlapping spans', () => {
    expect(
      toHighlightSegments('abcdef', [
        [0, 2],
        [2, 4],
      ]),
    ).toEqual([
      { text: 'abcd', marked: true },
      { text: 'ef', marked: false },
    ]);
  });

  it('clamps out-of-range spans to the text length', () => {
    expect(toHighlightSegments('abc', [[0, 100]])).toEqual([{ text: 'abc', marked: true }]);
  });
});
