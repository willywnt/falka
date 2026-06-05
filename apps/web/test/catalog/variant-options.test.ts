import { describe, expect, it } from 'vitest';

import {
  findOptionError,
  formatSubOptions,
  groupVariantsByFirstOption,
  optionsSignature,
  suggestVariantName,
  suggestVariantSku,
} from '@/modules/catalog/utils/options';
import {
  parseOptionTypes,
  parseVariantOptions,
  type VariantOption,
} from '@/modules/catalog/validators/options';

describe('parseVariantOptions', () => {
  it('parses and trims a valid options array', () => {
    expect(
      parseVariantOptions([
        { name: ' Model ', value: ' 16 ' },
        { name: 'Warna', value: 'Hitam' },
      ]),
    ).toEqual([
      { name: 'Model', value: '16' },
      { name: 'Warna', value: 'Hitam' },
    ]);
  });

  it('returns [] for null, legacy, or malformed shapes', () => {
    expect(parseVariantOptions(null)).toEqual([]);
    expect(parseVariantOptions('nope')).toEqual([]);
    expect(parseVariantOptions([{ name: 'Model' }])).toEqual([]);
    expect(parseVariantOptions([{ name: '', value: 'x' }])).toEqual([]);
  });
});

describe('parseOptionTypes', () => {
  it('parses and trims a valid dimension list', () => {
    expect(parseOptionTypes([' Model ', 'Warna'])).toEqual(['Model', 'Warna']);
  });

  it('returns [] for null or malformed shapes', () => {
    expect(parseOptionTypes(null)).toEqual([]);
    expect(parseOptionTypes([1, 2])).toEqual([]);
  });
});

describe('groupVariantsByFirstOption', () => {
  const opt = (name: string, value: string): VariantOption => ({ name, value });

  it('returns null when no variant carries any option', () => {
    expect(groupVariantsByFirstOption([{ options: [] }, { options: [] }])).toBeNull();
  });

  it('groups by the first option value, preserving first-seen order', () => {
    const variants = [
      { id: 'a', options: [opt('Model', '16'), opt('Warna', 'Hitam')] },
      { id: 'b', options: [opt('Model', '17'), opt('Warna', 'Hitam')] },
      { id: 'c', options: [opt('Model', '16'), opt('Warna', 'Putih')] },
    ];

    const groups = groupVariantsByFirstOption(variants);

    expect(groups?.map((group) => group.value)).toEqual(['16', '17']);
    expect(groups?.[0]?.variants.map((v) => v.id)).toEqual(['a', 'c']);
    expect(groups?.[1]?.variants.map((v) => v.id)).toEqual(['b']);
  });

  it('collects variants without a first option under the empty-key group', () => {
    const groups = groupVariantsByFirstOption([
      { id: 'a', options: [opt('Model', '16')] },
      { id: 'b', options: [] },
    ]);

    expect(groups?.map((group) => group.value)).toEqual(['16', '']);
  });
});

describe('formatSubOptions', () => {
  it('joins option values after the first dimension', () => {
    expect(
      formatSubOptions([
        { name: 'Model', value: '16' },
        { name: 'Warna', value: 'Hitam' },
        { name: 'Storage', value: '128GB' },
      ]),
    ).toBe('Hitam · 128GB');
  });

  it('returns an empty string when there is no sub-dimension', () => {
    expect(formatSubOptions([{ name: 'Model', value: '16' }])).toBe('');
    expect(formatSubOptions([])).toBe('');
  });
});

describe('optionsSignature', () => {
  it('is order- and case-insensitive', () => {
    const a = optionsSignature([
      { name: 'Model', value: '16' },
      { name: 'Warna', value: 'Hitam' },
    ]);
    const b = optionsSignature([
      { name: 'Warna', value: 'hitam' },
      { name: 'model', value: '16' },
    ]);
    expect(a).toBe(b);
  });

  it('distinguishes different values', () => {
    expect(optionsSignature([{ name: 'Warna', value: 'Hitam' }])).not.toBe(
      optionsSignature([{ name: 'Warna', value: 'Putih' }]),
    );
  });

  it('yields an empty signature for no options', () => {
    expect(optionsSignature([])).toBe('');
  });
});

describe('findOptionError', () => {
  it('accepts options whose names are all declared', () => {
    expect(
      findOptionError(
        ['Model', 'Warna'],
        [
          { name: 'Model', value: '16' },
          { name: 'Warna', value: 'Hitam' },
        ],
      ),
    ).toBeNull();
  });

  it('accepts an empty options array regardless of declared dimensions', () => {
    expect(findOptionError(['Model'], [])).toBeNull();
    expect(findOptionError([], [])).toBeNull();
  });

  it('rejects an option name not declared on the product', () => {
    expect(findOptionError(['Model'], [{ name: 'Warna', value: 'Hitam' }])).toMatch(/Unknown/);
    expect(findOptionError([], [{ name: 'Model', value: '16' }])).toMatch(/Unknown/);
  });

  it('rejects a duplicate option name', () => {
    expect(
      findOptionError(
        ['Model'],
        [
          { name: 'Model', value: '16' },
          { name: 'Model', value: '17' },
        ],
      ),
    ).toMatch(/Duplicate/);
  });
});

describe('suggestVariantSku', () => {
  it('slugs the product name and values into an uppercase SKU', () => {
    expect(suggestVariantSku('iPhone', ['16', 'Hitam'])).toBe('IPHONE-16-HITAM');
    expect(suggestVariantSku('Kaos Polos', ['Black', 'M'])).toBe('KAOS-POLOS-BLACK-M');
  });

  it('drops empty segments and odd separators', () => {
    expect(suggestVariantSku('iPhone', ['', ' 128 GB '])).toBe('IPHONE-128-GB');
  });
});

describe('suggestVariantName', () => {
  it('joins non-empty values with a slash', () => {
    expect(suggestVariantName(['16', 'Hitam'])).toBe('16 / Hitam');
    expect(suggestVariantName(['', 'Hitam'])).toBe('Hitam');
    expect(suggestVariantName([])).toBe('');
  });
});
