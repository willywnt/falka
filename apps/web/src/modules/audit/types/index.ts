import { DEFAULT_PAGE_SIZE } from '@olshop/config/limits';
import type { AuditAction } from '@olshop/types';

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
