import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '@falka/config/limits';
import { z } from 'zod';

export const listNotificationsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
});

export type ListNotificationsQuery = z.infer<typeof listNotificationsQuerySchema>;
