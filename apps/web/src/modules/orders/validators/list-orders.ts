import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '@olshop/config/limits';
import { z } from 'zod';

/** Page params for the orders list (newest first; tenant-scoped in the service). */
export const listOrdersQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
});

export type ListOrdersQuery = z.infer<typeof listOrdersQuerySchema>;
