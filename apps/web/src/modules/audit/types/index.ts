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
  defaultPageSize: 20,
};
