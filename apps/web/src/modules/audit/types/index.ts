import { DEFAULT_PAGE_SIZE } from '@falka/config/limits';
import type { AuditAction } from '@falka/types';

export interface AuditLogListItem {
  id: string;
  action: AuditAction;
  resourceType: string;
  resourceId: string | null;
  userId: string | null;
  createdAt: string;
}

export interface AuditModuleConfig {
  defaultPageSize: number;
}

export const auditModuleConfig: AuditModuleConfig = {
  defaultPageSize: DEFAULT_PAGE_SIZE,
};
