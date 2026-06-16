import 'server-only';

import { buildPaginatedResult, prisma, type PaginatedResult } from '@falka/db';
import type { Prisma } from '@prisma/client';

import { appLogger } from '@/lib/logger';

import { NotificationError } from '../errors/notification-errors';
import { NOTIFICATION_TYPE_META } from '../notification-meta';
import type { EmitNotificationInput, NotificationListItem } from '../types';
import type { ListNotificationsQuery } from '../validators';

export type NotificationsListResult = PaginatedResult<NotificationListItem> & {
  unreadCount: number;
};

/** A notification is visible to a member if it's org-wide OR targeted to them. */
function visibleWhere(organizationId: string, userId: string): Prisma.NotificationWhereInput {
  return {
    organizationId,
    OR: [{ recipientUserId: null }, { recipientUserId: userId }],
  };
}

/**
 * Owns the persistent notification event-log. Read state is per-user (the
 * NotificationRead join) because an org has many members. Writing is BEST-EFFORT
 * (mirrors auditService.log): producers call `emit` AFTER their transaction
 * commits, so a notification bug can never roll back the action it describes.
 */
export class NotificationServerService {
  /**
   * Record an event. Swallows failures with a warn (best-effort) and is idempotent
   * via the (organizationId, dedupeKey) unique — a re-fired event is a no-op.
   * Always invoked fire-and-forget: `void notificationServerService.emit(…)`.
   */
  async emit(input: EmitNotificationInput): Promise<void> {
    try {
      const meta = NOTIFICATION_TYPE_META[input.type];
      await prisma.notification.upsert({
        where: {
          organizationId_dedupeKey: {
            organizationId: input.organizationId,
            dedupeKey: input.dedupeKey,
          },
        },
        create: {
          organizationId: input.organizationId,
          recipientUserId: input.recipientUserId ?? null,
          actorUserId: input.actorUserId ?? null,
          type: input.type,
          category: meta.category,
          severity: input.severity ?? meta.severity,
          title: input.title,
          body: input.body,
          href: input.href ?? null,
          dedupeKey: input.dedupeKey,
          entityType: input.entityType ?? null,
          entityId: input.entityId ?? null,
          count: input.count ?? 1,
          ...(input.data !== undefined ? { data: input.data as Prisma.InputJsonValue } : {}),
        },
        update: {},
      });
    } catch (error) {
      appLogger.warn('notification.emit.failed', {
        organizationId: input.organizationId,
        type: input.type,
        dedupeKey: input.dedupeKey,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /** The member's notifications (org-wide + targeted), newest first, with read state + unread count. */
  async list(
    organizationId: string,
    userId: string,
    query: ListNotificationsQuery,
  ): Promise<NotificationsListResult> {
    const where = visibleWhere(organizationId, userId);

    const [rows, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        include: { reads: { where: { userId }, select: { id: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { ...where, reads: { none: { userId } } } }),
    ]);

    const items: NotificationListItem[] = rows.map((row) => ({
      id: row.id,
      type: row.type,
      category: row.category,
      severity: row.severity,
      title: row.title,
      body: row.body,
      href: row.href,
      dedupeKey: row.dedupeKey,
      count: row.count,
      createdAt: row.createdAt.toISOString(),
      read: row.reads.length > 0,
    }));

    return { ...buildPaginatedResult(items, total, query.page, query.pageSize), unreadCount };
  }

  /** Mark one notification read for this member (idempotent). */
  async markRead(organizationId: string, userId: string, notificationId: string): Promise<void> {
    const notification = await prisma.notification.findFirst({
      where: { id: notificationId, ...visibleWhere(organizationId, userId) },
      select: { id: true },
    });
    if (!notification) throw NotificationError.notFound();

    await prisma.notificationRead.upsert({
      where: { notificationId_userId: { notificationId, userId } },
      create: { notificationId, userId },
      update: {},
    });
  }

  /** Mark every currently-unread notification read for this member. */
  async markAllRead(organizationId: string, userId: string): Promise<{ updated: number }> {
    const unread = await prisma.notification.findMany({
      where: { ...visibleWhere(organizationId, userId), reads: { none: { userId } } },
      select: { id: true },
    });
    if (unread.length === 0) return { updated: 0 };

    await prisma.notificationRead.createMany({
      data: unread.map((notification) => ({ notificationId: notification.id, userId })),
      skipDuplicates: true,
    });
    return { updated: unread.length };
  }
}

export const notificationServerService = new NotificationServerService();
