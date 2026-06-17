import { describe, expect, it } from 'vitest';

import { expandQueryToken, SEARCH_SYNONYMS } from '@/lib/search/search-synonyms';

/** The synonym/typo expansion that feeds the fuzzy scorer. */
describe('expandQueryToken', () => {
  it('returns the token first, then its aliases', () => {
    expect(expandQueryToken('invoice')).toEqual(['invoice', 'struk', 'penjualan']);
    expect(expandQueryToken('gudang')).toEqual(['gudang', 'inventaris', 'stok']);
  });

  it('maps a common typo to the correct word', () => {
    expect(expandQueryToken('pesnan')).toEqual(['pesnan', 'pesanan']);
    expect(expandQueryToken('inventori')).toEqual(['inventori', 'inventaris']);
  });

  it('returns just the token when it has no aliases', () => {
    expect(expandQueryToken('kasir')).toEqual(['kasir']);
    expect(expandQueryToken('xyz')).toEqual(['xyz']);
  });

  it('keys and values are lowercase (matching is case-folded upstream)', () => {
    for (const [key, values] of Object.entries(SEARCH_SYNONYMS)) {
      expect(key).toBe(key.toLowerCase());
      for (const value of values) expect(value).toBe(value.toLowerCase());
    }
  });
});
