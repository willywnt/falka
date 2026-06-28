import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '@palka/config/limits';
import { z } from 'zod';

/** Paginated audit-trail list, newest first. */
export const listAuditLogsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
});
export type ListAuditLogsQuery = z.infer<typeof listAuditLogsQuerySchema>;

export function parseListAuditLogsQuery(searchParams: URLSearchParams) {
  return listAuditLogsQuerySchema.safeParse({
    page: searchParams.get('page') ?? undefined,
    pageSize: searchParams.get('pageSize') ?? undefined,
  });
}
