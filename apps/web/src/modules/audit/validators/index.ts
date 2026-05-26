import { z } from 'zod';

export const listAuditLogsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  action: z
    .enum(['create', 'update', 'delete', 'login', 'logout', 'sync', 'upload'])
    .optional(),
  resourceType: z.string().optional(),
});

export type ListAuditLogsInput = z.infer<typeof listAuditLogsSchema>;
