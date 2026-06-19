import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '@falka/config/limits';
import { z } from 'zod';

/**
 * Page + filter params for the sales list (newest first; tenant-scoped in the
 * service). `search` matches the sale code / customer name, case-insensitive.
 */
export const listSalesQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
  search: z.string().trim().min(1).max(64).optional(),
});

export type ListSalesQuery = z.infer<typeof listSalesQuerySchema>;
