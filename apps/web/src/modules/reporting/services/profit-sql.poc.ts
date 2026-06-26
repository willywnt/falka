import 'server-only';

import { prisma } from '@falka/db';
import { Prisma } from '@prisma/client';

import type { ProfitChannel, ProfitMetrics, ProfitReport } from '../types';
import type { ProfitReportQuery } from '../validators/profit-report';
import { newAcc, toMetrics, type Acc } from '../utils/metrics';

/**
 * POC: the profit report's CORE money aggregation (summary + per-channel + per-period)
 * pushed DOWN to SQL — instead of loading every sold line into memory and reducing in JS.
 *
 * A `sold_lines` CTE unions the same four sources `loadSoldLines` builds (POS sale lines,
 * POS refund reversals, marketplace order lines, processed-return reversals) with the SAME
 * per-line NET math (PPN carve-out + discount). The DB does the SUM/GROUP BY; we only roll
 * the small per-(channel, period) result up through the EXISTING `toMetrics`/`money` utils —
 * so rounding is identical to the JS path and the ONLY difference is float (JS) vs NUMERIC
 * (SQL) summation. Validated against `getProfitReport` on real data before going anywhere.
 */
type RawRow = {
  channel: string;
  period: string;
  gross_revenue: number;
  cost_known_revenue: number;
  cogs: number;
  units: number;
  cost_unknown_lines: number;
};

type CoreProfit = Pick<ProfitReport, 'summary' | 'byChannel' | 'byPeriod'>;

function periodBucket(groupBy: ProfitReportQuery['groupBy']): Prisma.Sql {
  if (groupBy === 'month') return Prisma.sql`to_char(sl.d AT TIME ZONE 'UTC', 'YYYY-MM')`;
  if (groupBy === 'week') return Prisma.sql`to_char(sl.d AT TIME ZONE 'UTC', 'IYYY-"W"IW')`;
  return Prisma.sql`to_char(sl.d AT TIME ZONE 'UTC', 'YYYY-MM-DD')`;
}

function accFromRows(rows: RawRow[]): Acc {
  const acc = newAcc();
  for (const row of rows) {
    acc.grossRevenue += row.gross_revenue;
    acc.costKnownRevenue += row.cost_known_revenue;
    acc.cogs += row.cogs;
    acc.units += row.units;
    acc.costUnknownLines += row.cost_unknown_lines;
  }
  return acc;
}

export async function getProfitCoreSql(
  organizationId: string,
  query: ProfitReportQuery,
): Promise<CoreProfit> {
  const to = query.to ?? new Date();
  const from = query.from ?? new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000);
  const bucket = periodBucket(query.groupBy);

  const rows = await prisma.$queryRaw<RawRow[]>(Prisma.sql`
    WITH sold_lines AS (
      -- POS sale lines (net = gross − line discount, PPN carved out when inclusive)
      SELECT
        s."createdAt" AS d,
        'POS' AS channel,
        (CASE WHEN s."taxInclusive" AND s."taxRate" > 0
              THEN GREATEST(0, si."unitPrice" * si."quantity" - si."discountAmount") * 100.0 / (100 + s."taxRate")
              ELSE GREATEST(0, si."unitPrice" * si."quantity" - si."discountAmount") END) AS revenue,
        si."quantity" AS units,
        (si."unitCost" IS NOT NULL) AS cost_known,
        (CASE WHEN si."unitCost" IS NOT NULL THEN si."unitCost" * si."quantity" ELSE 0 END) AS cogs
      FROM sale_items si
      JOIN sales s ON s.id = si."saleId"
      WHERE s."organizationId" = ${organizationId}
        AND s.status IN ('COMPLETED', 'PARTIALLY_REFUNDED')
        AND s."createdAt" >= ${from} AND s."createdAt" <= ${to}

      UNION ALL
      -- POS refund reversals (negative qty, at the sale line's net unit)
      SELECT
        rf."createdAt" AS d,
        'POS' AS channel,
        (CASE WHEN si."quantity" > 0
              THEN ((CASE WHEN s."taxInclusive" AND s."taxRate" > 0
                          THEN GREATEST(0, si."unitPrice" * si."quantity" - si."discountAmount") * 100.0 / (100 + s."taxRate")
                          ELSE GREATEST(0, si."unitPrice" * si."quantity" - si."discountAmount") END) / si."quantity")
              ELSE 0 END) * (-rfi."quantity") AS revenue,
        -rfi."quantity" AS units,
        (si."unitCost" IS NOT NULL) AS cost_known,
        (CASE WHEN si."unitCost" IS NOT NULL THEN si."unitCost" * (-rfi."quantity") ELSE 0 END) AS cogs
      FROM sale_refund_items rfi
      JOIN sale_refunds rf ON rf.id = rfi."refundId"
      JOIN sale_items si ON si.id = rfi."saleItemId"
      JOIN sales s ON s.id = rf."saleId"
      WHERE rf."organizationId" = ${organizationId}
        AND s.status IN ('COMPLETED', 'PARTIALLY_REFUNDED')
        AND rf."createdAt" >= ${from} AND rf."createdAt" <= ${to}

      UNION ALL
      -- marketplace order lines (resolved variant only)
      SELECT
        o."placedAt" AS d,
        o.provider::text AS channel,
        COALESCE(oi."unitPrice", 0) * oi."quantity" AS revenue,
        oi."quantity" AS units,
        (oi."unitCost" IS NOT NULL) AS cost_known,
        (CASE WHEN oi."unitCost" IS NOT NULL THEN oi."unitCost" * oi."quantity" ELSE 0 END) AS cogs
      FROM order_items oi
      JOIN orders o ON o.id = oi."orderId"
      WHERE oi."productVariantId" IS NOT NULL
        AND o."organizationId" = ${organizationId}
        AND o.status IN ('SHIPPED', 'COMPLETED')
        AND o."placedAt" >= ${from} AND o."placedAt" <= ${to}

      UNION ALL
      -- processed-return reversals (negative qty, at the order line's snapshot)
      SELECT
        r."processedAt" AS d,
        o.provider::text AS channel,
        COALESCE(oi."unitPrice", 0) * (-ri."quantity") AS revenue,
        -ri."quantity" AS units,
        (oi."unitCost" IS NOT NULL) AS cost_known,
        (CASE WHEN oi."unitCost" IS NOT NULL THEN oi."unitCost" * (-ri."quantity") ELSE 0 END) AS cogs
      FROM return_items ri
      JOIN returns r ON r.id = ri."returnId"
      JOIN orders o ON o.id = r."orderId"
      JOIN order_items oi ON oi.id = ri."orderItemId"
      WHERE r."organizationId" = ${organizationId}
        AND r.status = 'RECEIVED'
        AND o.status IN ('SHIPPED', 'COMPLETED')
        AND ri."productVariantId" IS NOT NULL
        AND r."processedAt" >= ${from} AND r."processedAt" <= ${to}
    )
    SELECT
      sl.channel AS channel,
      ${bucket} AS period,
      SUM(sl.revenue)::float8 AS gross_revenue,
      SUM(CASE WHEN sl.cost_known THEN sl.revenue ELSE 0 END)::float8 AS cost_known_revenue,
      SUM(sl.cogs)::float8 AS cogs,
      SUM(sl.units)::int AS units,
      SUM(CASE WHEN sl.cost_known THEN 0 ELSE 1 END)::int AS cost_unknown_lines
    FROM sold_lines sl
    GROUP BY sl.channel, ${bucket}
  `);

  const byChannelRows = new Map<string, RawRow[]>();
  const byPeriodRows = new Map<string, RawRow[]>();
  for (const row of rows) {
    const channelRows = byChannelRows.get(row.channel);
    if (channelRows) channelRows.push(row);
    else byChannelRows.set(row.channel, [row]);

    const periodRows = byPeriodRows.get(row.period);
    if (periodRows) periodRows.push(row);
    else byPeriodRows.set(row.period, [row]);
  }

  const summary: ProfitMetrics = toMetrics(accFromRows(rows));
  const byChannel = [...byChannelRows.entries()]
    .map(([channel, channelRows]) => ({
      ...toMetrics(accFromRows(channelRows)),
      channel: channel as ProfitChannel,
    }))
    .sort((a, b) => Number(b.grossRevenue) - Number(a.grossRevenue));
  const byPeriod = [...byPeriodRows.entries()]
    .map(([period, periodRows]) => ({ ...toMetrics(accFromRows(periodRows)), period }))
    .sort((a, b) => a.period.localeCompare(b.period));

  return { summary, byChannel, byPeriod };
}
