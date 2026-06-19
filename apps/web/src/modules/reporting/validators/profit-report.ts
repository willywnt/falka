import { z } from 'zod';

import { MAX_REPORT_RANGE_DAYS } from '../config';

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Profit report query: an optional inclusive date range (`to` is treated as the
 * whole day by the service) and the period grouping. When the range is omitted
 * the service falls back to the last 30 days. A supplied range is capped at
 * {@link MAX_REPORT_RANGE_DAYS} so the in-memory aggregation can't be asked to
 * pull an unbounded slice of sales history.
 */
export const profitReportQuerySchema = z
  .object({
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
    groupBy: z.enum(['day', 'week', 'month']).default('day'),
  })
  .refine(
    (value) =>
      !value.from ||
      !value.to ||
      (value.to.getTime() - value.from.getTime()) / DAY_MS <= MAX_REPORT_RANGE_DAYS,
    {
      message: `Rentang tanggal maksimal ${MAX_REPORT_RANGE_DAYS} hari.`,
      path: ['to'],
    },
  );

export type ProfitReportQuery = z.infer<typeof profitReportQuerySchema>;

/** Parse the profit query from a URL query string (shared by the report + export routes). */
export function parseProfitReportQuery(searchParams: URLSearchParams) {
  return profitReportQuerySchema.safeParse({
    from: searchParams.get('from') ?? undefined,
    to: searchParams.get('to') ?? undefined,
    groupBy: searchParams.get('groupBy') ?? undefined,
  });
}
