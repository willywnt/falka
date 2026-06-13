import 'server-only';

import { buildPaginatedResult, prisma, type PaginatedResult } from '@falka/db';
import type { Prisma } from '@prisma/client';

import { appLogger } from '@/lib/logger';

import type { AuditLogListItem } from '../types';
import type { ListAuditLogsQuery } from '../validators';

export interface AuditLogEntryInput {
  organizationId: string;
  /** Null = system/platform event with no human actor. */
  actorUserId: string | null;
  action: string;
  /** Resource TYPE (e.g. 'sale', 'product'); the row id goes in resourceId. */
  resource: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
}

/**
 * Append-only audit trail for sensitive org actions. Writing is BEST-EFFORT:
 * the trail must never break the action it describes, so `log` swallows every
 * failure with a warn. Callers fire it AFTER their transaction succeeds.
 */
export class AuditService {
  async log(entry: AuditLogEntryInput): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          userId: entry.actorUserId,
          organizationId: entry.organizationId,
          action: entry.action,
          resource: entry.resource,
          resourceId: entry.resourceId ?? null,
          ipAddress: entry.ipAddress ?? null,
          ...(entry.metadata !== undefined
            ? { metadata: entry.metadata as Prisma.InputJsonValue }
            : {}),
        },
      });
    } catch (error) {
      appLogger.warn('audit.log.failed', {
        organizationId: entry.organizationId,
        action: entry.action,
        resource: entry.resource,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /** The org's audit trail, newest first, with the actor's name for display. */
  async list(
    organizationId: string,
    query: ListAuditLogsQuery,
  ): Promise<PaginatedResult<AuditLogListItem>> {
    const where = { organizationId };

    const [rows, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        select: {
          id: true,
          action: true,
          resource: true,
          resourceId: true,
          userId: true,
          createdAt: true,
          user: { select: { displayName: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      prisma.auditLog.count({ where }),
    ]);

    const items: AuditLogListItem[] = rows.map((row) => ({
      id: row.id,
      action: row.action,
      resource: row.resource,
      resourceId: row.resourceId,
      actorUserId: row.userId,
      actorName: row.user?.displayName ?? row.user?.email ?? null,
      createdAt: row.createdAt.toISOString(),
    }));

    return buildPaginatedResult(items, total, query.page, query.pageSize);
  }
}

export const auditService = new AuditService();
