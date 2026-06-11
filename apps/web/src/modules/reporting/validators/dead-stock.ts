import { z } from 'zod';

/**
 * Dead-stock query: the "no sales in N days" threshold. A variant still holding
 * stock that hasn't sold for at least this many days (or, when never sold, that is
 * older than it) counts as dead. Defaults to 60 days — the same horizon the
 * reorder report treats as dead.
 */
export const deadStockQuerySchema = z.object({
  staleDays: z.coerce.number().int().min(7).max(365).default(60),
});

export type DeadStockQuery = z.infer<typeof deadStockQuerySchema>;

/** Parse the dead-stock query from a URL query string (shared by the report + export routes). */
export function parseDeadStockQuery(searchParams: URLSearchParams) {
  return deadStockQuerySchema.safeParse({
    staleDays: searchParams.get('staleDays') ?? undefined,
  });
}
