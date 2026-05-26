import { z } from 'zod';

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export type PaginationInput = z.infer<typeof paginationSchema>;

export const paginatedQuerySchema = paginationSchema.extend({
  sortBy: z.string().min(1).optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type PaginatedQueryInput = z.infer<typeof paginatedQuerySchema>;
