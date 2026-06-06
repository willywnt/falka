import { z } from 'zod';

/**
 * Profit report query: an optional inclusive date range (`to` is treated as the
 * whole day by the service) and the period grouping. When the range is omitted
 * the service falls back to the last 30 days.
 */
export const profitReportQuerySchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  groupBy: z.enum(['day', 'week', 'month']).default('day'),
});

export type ProfitReportQuery = z.infer<typeof profitReportQuerySchema>;

/** Parse the profit query from a URL query string (shared by the report + export routes). */
export function parseProfitReportQuery(searchParams: URLSearchParams) {
  return profitReportQuerySchema.safeParse({
    from: searchParams.get('from') ?? undefined,
    to: searchParams.get('to') ?? undefined,
    groupBy: searchParams.get('groupBy') ?? undefined,
  });
}
