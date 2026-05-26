import type { AuditLogListItem } from '../types';
import { appLogger } from '@/lib/logger';

export class AuditService {
  async list(_organizationId: string, _query?: { page?: number; pageSize?: number }): Promise<AuditLogListItem[]> {
    appLogger.info('AuditService.list called');
    return [];
  }

  async log(_entry: {
    organizationId: string;
    userId: string | null;
    action: string;
    resourceType: string;
    resourceId?: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    appLogger.info('AuditService.log called');
  }
}

export const auditService = new AuditService();
