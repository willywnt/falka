import { describe, expect, it } from 'vitest';

import type { ExpenseLine } from '@/modules/finance/types';
import type { ProfitReport } from '@/modules/reporting/types';
import { aggregateNetProfit } from '@/modules/reporting/utils/net-profit-aggregate';

/** Minimal ProfitReport — the aggregate only reads range + summary + byPeriod.grossProfit. */
function profit(
  grossRevenue: string,
  grossProfit: string,
  byPeriod: [string, string][],
): ProfitReport {
  return {
    range: { from: '2026-06-01T00:00:00.000Z', to: '2026-06-30T23:59:59.999Z', groupBy: 'month' },
    summary: { grossRevenue, grossProfit, cogs: '0.00' },
    byPeriod: byPeriod.map(([period, gp]) => ({ period, grossProfit: gp })),
  } as unknown as ProfitReport;
}

function line(date: string, category: ExpenseLine['category'], amount: number): ExpenseLine {
  return { date: new Date(date), category, amount };
}

describe('aggregateNetProfit', () => {
  it('nets gross profit down by total operating expenses + computes net margin', () => {
    const report = aggregateNetProfit(
      profit('1000000.00', '600000.00', [['2026-06', '600000.00']]),
      [
        line('2026-06-05', 'ADVERTISING', 150000),
        line('2026-06-10', 'PACKAGING', 50000),
        line('2026-06-15', 'ADVERTISING', 100000),
      ],
      { groupBy: 'month' },
    );

    expect(report.summary.operatingExpenses).toBe('300000.00');
    expect(report.summary.netProfit).toBe('300000.00'); // 600k − 300k
    expect(report.summary.netMarginPct).toBe(30); // 300k / 1000k
    // Categories largest first; same-category lines summed.
    expect(report.byCategory).toEqual([
      { category: 'ADVERTISING', amount: '250000.00' },
      { category: 'PACKAGING', amount: '50000.00' },
    ]);
    expect(report.byPeriod).toEqual([
      {
        period: '2026-06',
        grossProfit: '600000.00',
        operatingExpenses: '300000.00',
        netProfit: '300000.00',
      },
    ]);
  });

  it('reports a negative net profit when expenses exceed gross profit', () => {
    const report = aggregateNetProfit(
      profit('500000.00', '200000.00', [['2026-06', '200000.00']]),
      [line('2026-06-09', 'SALARY', 350000)],
      { groupBy: 'month' },
    );

    expect(report.summary.netProfit).toBe('-150000.00');
    expect(report.summary.netMarginPct).toBe(-30); // −150k / 500k
  });

  it('includes a period that has expenses but no sales (gross profit 0)', () => {
    const report = aggregateNetProfit(
      profit('100000.00', '60000.00', [['2026-06', '60000.00']]),
      [line('2026-05-20', 'RENT', 40000)],
      { groupBy: 'month' },
    );

    const may = report.byPeriod.find((row) => row.period === '2026-05');
    expect(may).toEqual({
      period: '2026-05',
      grossProfit: '0.00',
      operatingExpenses: '40000.00',
      netProfit: '-40000.00',
    });
  });

  it('net margin is null when there is no revenue', () => {
    const report = aggregateNetProfit(profit('0.00', '0.00', []), [], { groupBy: 'month' });
    expect(report.summary.netMarginPct).toBeNull();
    expect(report.summary.netProfit).toBe('0.00');
    expect(report.byCategory).toEqual([]);
  });
});
