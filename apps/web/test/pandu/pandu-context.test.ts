import { describe, expect, it } from 'vitest';

import { resolveNavSectionLabel } from '@/components/layout/nav-config';
import { resolvePanduContextChips } from '@/components/pandu/use-pandu-context';

/** Pandu's page-aware contextual chips + the section label that titles them. */
describe('resolvePanduContextChips', () => {
  it('returns the section shortcuts for a matching route', () => {
    const labels = resolvePanduContextChips('/dashboard/inventory').map((chip) => chip.label);
    expect(labels).toContain('Yang menipis');
    expect(labels).toContain('Stok mati');
  });

  it('matches a nested route via its prefix (longest-prefix)', () => {
    expect(resolvePanduContextChips('/dashboard/orders/12345').length).toBeGreaterThan(0);
  });

  it('hides a chip that points at the page already shown', () => {
    const hrefs = resolvePanduContextChips('/dashboard/inventory/reorder').map((chip) => chip.href);
    expect(hrefs).not.toContain('/dashboard/inventory/reorder');
  });

  it('returns nothing for a route with no shortcuts', () => {
    expect(resolvePanduContextChips('/dashboard/settings')).toEqual([]);
    expect(resolvePanduContextChips('/dashboard')).toEqual([]);
  });
});

describe('resolveNavSectionLabel', () => {
  it('resolves the owning section label for a route', () => {
    expect(resolveNavSectionLabel('/dashboard/inventory')).toBe('Stok');
    expect(resolveNavSectionLabel('/dashboard/sales')).toBe('Jualan');
  });

  it('returns undefined for an unknown route', () => {
    expect(resolveNavSectionLabel('/totally-unknown')).toBeUndefined();
  });
});
