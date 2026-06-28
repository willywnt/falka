import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '@palka/config/limits';
import { ReturnStatus } from '@prisma/client';
import { z } from 'zod';

export const listReturnsQuerySchema = z.object({
  status: z.nativeEnum(ReturnStatus).optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
});

export type ListReturnsQuery = z.infer<typeof listReturnsQuerySchema>;
