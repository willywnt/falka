import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '@palka/config/limits';
import { z } from 'zod';

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
});

export type PaginationInput = z.infer<typeof paginationSchema>;

export const paginatedQuerySchema = paginationSchema.extend({
  sortBy: z.string().min(1).optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type PaginatedQueryInput = z.infer<typeof paginatedQuerySchema>;
