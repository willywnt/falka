import { describe, expect, it } from 'vitest';

import { codeCandidateFlags, matchCodeHits } from '@/components/entity-jump-match';

/** The palette's SQL-LIKE entity-code matching (contains, exact-first, capped). */
describe('codeCandidateFlags', () => {
  it('a bare-digit fragment searches all three code lists', () => {
    expect(codeCandidateFlags('001')).toEqual({ sale: true, purchase: true, opname: true });
  });

  it('a letter-prefixed fragment biases to its own entity', () => {
    expect(codeCandidateFlags('s00001')).toEqual({ sale: true, purchase: false, opname: false });
    expect(codeCandidateFlags('po12')).toEqual({ sale: false, purchase: true, opname: false });
    expect(codeCandidateFlags('op05')).toEqual({ sale: false, purchase: false, opname: true });
  });

  it('is case-insensitive', () => {
    expect(codeCandidateFlags('S00042').sale).toBe(true);
  });

  it('a non-code word triggers nothing', () => {
    expect(codeCandidateFlags('kaos')).toEqual({ sale: false, purchase: false, opname: false });
    expect(codeCandidateFlags('produk')).toEqual({ sale: false, purchase: false, opname: false });
  });
});

describe('matchCodeHits', () => {
  const sales = [{ code: 'S00001' }, { code: 'S00042' }, { code: 'S00103' }];

  it('matches a contained fragment (SQL LIKE)', () => {
    expect(matchCodeHits(sales, '042')).toEqual([{ code: 'S00042' }]);
  });

  it('returns every code that contains the fragment', () => {
    // Each of S00001/S00042/S00103 contains "00".
    expect(matchCodeHits(sales, '00')).toHaveLength(3);
  });

  it('puts an exact match before partial ones', () => {
    const items = [{ code: 'AB12' }, { code: 'AB1' }];
    expect(matchCodeHits(items, 'AB1')).toEqual([{ code: 'AB1' }, { code: 'AB12' }]);
  });

  it('is case-insensitive', () => {
    expect(matchCodeHits(sales, 's00042')).toEqual([{ code: 'S00042' }]);
  });

  it('caps the result list', () => {
    const many = Array.from({ length: 9 }, (_, i) => ({ code: `S0000${i}` }));
    expect(matchCodeHits(many, '0', 5)).toHaveLength(5);
  });

  it('returns nothing for an empty query or missing data', () => {
    expect(matchCodeHits(sales, '')).toEqual([]);
    expect(matchCodeHits(undefined, '001')).toEqual([]);
  });
});
