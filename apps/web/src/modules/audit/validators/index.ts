import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '@falka/config/limits';
import { z } from 'zod';

export const listAuditLogsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
  action: z.enum(['create', 'update', 'delete', 'login', 'logout', 'sync', 'upload']).optional(),
  resourceType: z.string().optional(),
});

export type ListAuditLogsInput = z.infer<typeof listAuditLogsSchema>;
