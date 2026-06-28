import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '@palka/config/limits';
import { StockLedgerReason, StockLedgerSource } from '@prisma/client';
import { z } from 'zod';

/**
 * Filters for the stock activity log (a browsable view over the StockLedger).
 * `direction` partitions by delta sign (in = received, out = removed); `from`/`to`
 * are inclusive calendar dates (the service treats `to` as the whole day).
 */
export const stockActivityQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
  search: z.string().trim().max(100).optional(),
  reason: z.nativeEnum(StockLedgerReason).optional(),
  source: z.nativeEnum(StockLedgerSource).optional(),
  direction: z.enum(['in', 'out']).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export type StockActivityQuery = z.infer<typeof stockActivityQuerySchema>;

/** Parse activity filters from a URL query string (shared by the list + export routes). */
export function parseStockActivityQuery(searchParams: URLSearchParams) {
  return stockActivityQuerySchema.safeParse({
    page: searchParams.get('page') ?? undefined,
    pageSize: searchParams.get('pageSize') ?? undefined,
    search: searchParams.get('search') ?? undefined,
    reason: searchParams.get('reason') ?? undefined,
    source: searchParams.get('source') ?? undefined,
    direction: searchParams.get('direction') ?? undefined,
    from: searchParams.get('from') ?? undefined,
    to: searchParams.get('to') ?? undefined,
  });
}
