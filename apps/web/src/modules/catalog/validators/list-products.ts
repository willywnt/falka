import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '@olshop/config/limits';
import { z } from 'zod';

export const listProductsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
  search: z.string().trim().max(100).optional(),
});

export type ListProductsQuery = z.infer<typeof listProductsQuerySchema>;
