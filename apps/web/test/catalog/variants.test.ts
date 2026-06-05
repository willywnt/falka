import { describe, expect, it } from 'vitest';

import { buildVariantBlocks, suggestVariantSku } from '@/modules/catalog/utils/variants';

describe('buildVariantBlocks', () => {
  it('renders standalone variants (variantGroup null) as single blocks', () => {
    const blocks = buildVariantBlocks([
      { id: 'a', variantGroup: null },
      { id: 'b', variantGroup: null },
    ]);

    expect(blocks).toEqual([
      { kind: 'single', variant: { id: 'a', variantGroup: null } },
      { kind: 'single', variant: { id: 'b', variantGroup: null } },
    ]);
  });

  it('collapses subvariants sharing a group at the group first-seen position', () => {
    const blocks = buildVariantBlocks([
      { id: 'std', variantGroup: null },
      { id: 'blk', variantGroup: 'iPhone 16' },
      { id: 'wht', variantGroup: 'iPhone 16' },
    ]);

    expect(blocks).toHaveLength(2);
    expect(blocks[0]).toEqual({ kind: 'single', variant: { id: 'std', variantGroup: null } });

    const group = blocks[1];
    expect(group?.kind).toBe('group');
    if (group?.kind === 'group') {
      expect(group.name).toBe('iPhone 16');
      expect(group.variants.map((variant) => variant.id)).toEqual(['blk', 'wht']);
    }
  });

  it('routes a later mention of a group back into its original block', () => {
    const blocks = buildVariantBlocks([
      { id: 'a', variantGroup: 'G1' },
      { id: 'b', variantGroup: 'G2' },
      { id: 'c', variantGroup: 'G1' },
    ]);

    expect(blocks.map((block) => (block.kind === 'group' ? block.name : 'single'))).toEqual([
      'G1',
      'G2',
    ]);

    const g1 = blocks[0];
    if (g1?.kind === 'group') expect(g1.variants.map((variant) => variant.id)).toEqual(['a', 'c']);
  });
});

describe('suggestVariantSku', () => {
  it('slugs and joins parts into an uppercase SKU', () => {
    expect(suggestVariantSku('iPhone', '16', 'Hitam')).toBe('IPHONE-16-HITAM');
    expect(suggestVariantSku('Kaos Polos', 'Black', 'M')).toBe('KAOS-POLOS-BLACK-M');
  });

  it('drops empty segments and odd separators', () => {
    expect(suggestVariantSku('iPhone', '', ' 128 GB ')).toBe('IPHONE-128-GB');
  });
});
