import { describe, expect, it } from 'vitest';

import { buildNudgeCandidates } from '@/components/pandu/pandu-nudge-select';

/** The rule-based (but real-data) Pandu nudge selector. */
describe('buildNudgeCandidates', () => {
  it('emits nothing when every number is calm', () => {
    expect(buildNudgeCandidates({})).toEqual([]);
    expect(
      buildNudgeCandidates({
        invSummary: { oversoldCount: 0, lowStockCount: 0 },
        ordersToShip: 0,
      }),
    ).toEqual([]);
  });

  it('orders urgent before attention before info', () => {
    const groups = buildNudgeCandidates({
      reorderSummary: { urgentCount: 2, deadStockCount: 3, deadStockValue: '100000' },
      invSummary: { oversoldCount: 1, lowStockCount: 4 },
      ordersToShip: 5,
      returnsPending: 2,
      marketplaceUnhealthy: 1,
    }).map((nudge) => nudge.group);

    const firstAttention = groups.indexOf('attention');
    const firstInfo = groups.indexOf('info');
    expect(groups[0]).toBe('urgent');
    expect(firstAttention).toBeGreaterThan(groups.lastIndexOf('urgent'));
    expect(firstInfo).toBeGreaterThan(firstAttention);
  });

  it('surfaces the new ops-pulse nudges with real counts', () => {
    const byId = Object.fromEntries(
      buildNudgeCandidates({ ordersToShip: 7, returnsPending: 3, marketplaceUnhealthy: 2 }).map(
        (nudge) => [nudge.id, nudge],
      ),
    );
    expect(byId['orders-to-ship:7']?.text).toContain('7 pesanan');
    expect(byId['returns-pending:3']?.group).toBe('attention');
    expect(byId['marketplace-unhealthy:2']?.group).toBe('urgent');
  });

  it('a permission-gated marketplace count that is absent yields no nudge', () => {
    const ids = buildNudgeCandidates({ ordersToShip: 1 }).map((nudge) => nudge.id);
    expect(ids.some((id) => id.startsWith('marketplace-unhealthy'))).toBe(false);
  });

  it('embeds the count in the id so a dismissal re-arms when the number changes', () => {
    const [first] = buildNudgeCandidates({ ordersToShip: 3 });
    const [second] = buildNudgeCandidates({ ordersToShip: 4 });
    expect(first?.id).not.toBe(second?.id);
  });
});
