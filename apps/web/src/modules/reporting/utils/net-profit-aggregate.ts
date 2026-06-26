import type { ExpenseCategory } from '@prisma/client';

import type { ExpenseLine } from '@/modules/finance/types';

import type { NetProfitReport, ProfitPeriodGranularity, ProfitReport } from '../types';
import { money, periodKey, round2 } from './metrics';

/**
 * Net P&L = the profit report's gross profit MINUS operating expenses. Pure: takes the
 * already-computed {@link ProfitReport} (revenue − COGS) + the raw expense lines, sums the
 * expenses by category and by period, and folds them into the gross numbers. Money strings
 * use the SAME `money()` rounding as the profit report so the two reconcile.
 */
export function aggregateNetProfit(
  profit: ProfitReport,
  expenseLines: ExpenseLine[],
  opts: { groupBy: ProfitPeriodGranularity },
): NetProfitReport {
  let totalExpenses = 0;
  const byCategory = new Map<ExpenseCategory, number>();
  const expensesByPeriod = new Map<string, number>();

  for (const line of expenseLines) {
    totalExpenses += line.amount;
    byCategory.set(line.category, (byCategory.get(line.category) ?? 0) + line.amount);
    const key = periodKey(line.date, opts.groupBy);
    expensesByPeriod.set(key, (expensesByPeriod.get(key) ?? 0) + line.amount);
  }

  const grossProfit = Number(profit.summary.grossProfit);
  const grossRevenue = Number(profit.summary.grossRevenue);
  const netProfit = grossProfit - totalExpenses;

  // Per-period trend: every period that has revenue OR expenses.
  const grossProfitByPeriod = new Map(
    profit.byPeriod.map((row) => [row.period, Number(row.grossProfit)]),
  );
  const periods = new Set<string>([...grossProfitByPeriod.keys(), ...expensesByPeriod.keys()]);
  const periodTrend = [...periods].sort().map((period) => {
    const gp = grossProfitByPeriod.get(period) ?? 0;
    const exp = expensesByPeriod.get(period) ?? 0;
    return {
      period,
      grossProfit: money(gp),
      operatingExpenses: money(exp),
      netProfit: money(gp - exp),
    };
  });

  return {
    range: profit.range,
    summary: {
      grossRevenue: profit.summary.grossRevenue,
      cogs: profit.summary.cogs,
      grossProfit: profit.summary.grossProfit,
      operatingExpenses: money(totalExpenses),
      netProfit: money(netProfit),
      netMarginPct: grossRevenue > 0 ? round2((netProfit / grossRevenue) * 100) : null,
    },
    byCategory: [...byCategory.entries()]
      .map(([category, amount]) => ({ category, amount: money(amount) }))
      .sort((a, b) => Number(b.amount) - Number(a.amount)),
    byPeriod: periodTrend,
  };
}
