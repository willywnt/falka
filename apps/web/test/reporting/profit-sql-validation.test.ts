import { describe, expect, it } from 'vitest';

import { getProfitCoreSql } from '@/modules/reporting/services/profit-sql.poc';
import { reportingServerService } from '@/modules/reporting/services/reporting-server.service';
import type { ProfitMetrics } from '@/modules/reporting/types';
import type { ProfitReportQuery } from '@/modules/reporting/validators/profit-report';

/**
 * POC validation — compares the JS aggregation (getProfitReport) against the SQL
 * aggregation (getProfitCoreSql) and prints a field-by-field diff. It runs ONLY when
 * DATABASE_URL points at a LOCAL Postgres (skipped in CI + the normal mocked-Prisma suite).
 * Because it compares JS vs SQL, it passes on ANY local data (even none) — it fails only if
 * the two aggregations disagree, which is exactly the regression it guards.
 *
 * Run: pnpm --filter @falka/db exec node scripts/with-env.mjs \
 *        pnpm --filter @falka/web exec vitest run test/reporting/profit-sql-validation.test.ts
 */
const RUN = Boolean(process.env.DATABASE_URL?.includes('localhost'));
const ORG = 'cmqi8bhnd0000u704ipqvisun';
const GROUPINGS = ['day', 'week', 'month'] as const;
const MONEY_FIELDS = ['grossRevenue', 'costKnownRevenue', 'cogs', 'grossProfit'] as const;
const TOLERANCE = 0.01; // ≤1 cent — float (JS) vs NUMERIC (SQL) rounding boundary

function delta(a: string, b: string): number {
  return Math.abs(Number(a) - Number(b));
}

function compareMetrics(label: string, js: ProfitMetrics, sql: ProfitMetrics): number {
  let max = 0;
  const parts: string[] = [];
  for (const field of MONEY_FIELDS) {
    const d = delta(js[field], sql[field]);
    max = Math.max(max, d);
    parts.push(`${field} js=${js[field]} sql=${sql[field]} Δ=${d.toFixed(4)}`);
  }
  console.log(`  ${label}: units js=${js.unitsSold}/sql=${sql.unitsSold} | ${parts.join(' · ')}`);
  expect(sql.unitsSold, `${label} unitsSold`).toBe(js.unitsSold);
  return max;
}

describe.skipIf(!RUN)('profit report — SQL aggregation vs JS (real local DB)', () => {
  for (const groupBy of GROUPINGS) {
    it(`matches summary + channels + periods (groupBy=${groupBy})`, async () => {
      const query = {
        from: new Date('2020-01-01T00:00:00.000Z'),
        to: new Date(),
        groupBy,
      } as ProfitReportQuery;

      const js = await reportingServerService.getProfitReport(ORG, query);
      const sql = await getProfitCoreSql(ORG, query);

      console.log(`\n=== groupBy=${groupBy} (org ${ORG}) ===`);
      let maxDelta = compareMetrics('SUMMARY', js.summary, sql.summary);

      // Channels — same set, same money within tolerance.
      const jsChannels = new Map(js.byChannel.map((c) => [c.channel, c]));
      const sqlChannels = new Map(sql.byChannel.map((c) => [c.channel, c]));
      expect([...sqlChannels.keys()].sort(), 'channel set').toEqual([...jsChannels.keys()].sort());
      for (const [channel, jsMetrics] of jsChannels) {
        const sqlMetrics = sqlChannels.get(channel)!;
        maxDelta = Math.max(maxDelta, compareMetrics(`channel:${channel}`, jsMetrics, sqlMetrics));
      }

      // Periods — same set, same money within tolerance.
      const jsPeriods = new Map(js.byPeriod.map((p) => [p.period, p]));
      const sqlPeriods = new Map(sql.byPeriod.map((p) => [p.period, p]));
      expect([...sqlPeriods.keys()].sort(), 'period set').toEqual([...jsPeriods.keys()].sort());
      for (const [period, jsMetrics] of jsPeriods) {
        const sqlMetrics = sqlPeriods.get(period)!;
        maxDelta = Math.max(maxDelta, compareMetrics(`period:${period}`, jsMetrics, sqlMetrics));
      }

      console.log(`  >>> max money Δ = ${maxDelta.toFixed(4)} (tolerance ${TOLERANCE})`);
      expect(maxDelta, 'max money delta across summary/channels/periods').toBeLessThanOrEqual(
        TOLERANCE,
      );
    });
  }
});
