import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Audit trail service, exercised against the real service with Prisma mocked.
 * Guards: log() maps the entry onto the AuditLog columns; log() is BEST-EFFORT —
 * a throwing create is swallowed with a warn, never rethrown (the audited action
 * must not fail because its trail did); list() is org-scoped, newest first, maps
 * the actor's display name (email fallback), and gets the pagination math right.
 */

const { prismaMock, warnMock } = vi.hoisted(() => ({
  prismaMock: {
    auditLog: { create: vi.fn(), findMany: vi.fn(), count: vi.fn() },
  },
  warnMock: vi.fn(),
}));

vi.mock('@palka/db', () => ({
  prisma: prismaMock,
  buildPaginatedResult: (items: unknown[], total: number, page: number, pageSize: number) => ({
    items,
    meta: {
      page,
      pageSize,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / pageSize),
      hasNextPage: page * pageSize < total,
      hasPreviousPage: page > 1,
    },
  }),
}));
vi.mock('@/lib/logger', () => ({
  appLogger: { info: vi.fn(), warn: warnMock, error: vi.fn(), debug: vi.fn() },
}));

const { AuditService } = await import('@/modules/audit/services/audit.service');

const service = new AuditService();
const ORG = 'org-1';

beforeEach(() => {
  vi.clearAllMocks();
  prismaMock.auditLog.create.mockResolvedValue({ id: 'log-1' });
});

describe('log', () => {
  it('writes the entry onto the AuditLog columns (actor → userId, resource type + row id)', async () => {
    await service.log({
      organizationId: ORG,
      actorUserId: 'user-1',
      action: 'sales.refunded',
      resource: 'sale',
      resourceId: 'sale-1',
      metadata: { code: 'RF00001', totalAmount: 25_000 },
      ipAddress: '10.0.0.1',
    });

    expect(prismaMock.auditLog.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-1',
        organizationId: ORG,
        action: 'sales.refunded',
        resource: 'sale',
        resourceId: 'sale-1',
        ipAddress: '10.0.0.1',
        metadata: { code: 'RF00001', totalAmount: 25_000 },
      },
    });
  });

  it('nulls the optional columns and omits metadata when not provided', async () => {
    await service.log({
      organizationId: ORG,
      actorUserId: null,
      action: 'auth.login',
      resource: 'session',
    });

    expect(prismaMock.auditLog.create).toHaveBeenCalledWith({
      data: {
        userId: null,
        organizationId: ORG,
        action: 'auth.login',
        resource: 'session',
        resourceId: null,
        ipAddress: null,
      },
    });
  });

  it('swallows a throwing create with a warn — never rethrows', async () => {
    prismaMock.auditLog.create.mockRejectedValue(new Error('db down'));

    await expect(
      service.log({
        organizationId: ORG,
        actorUserId: 'user-1',
        action: 'sales.voided',
        resource: 'sale',
        resourceId: 'sale-1',
      }),
    ).resolves.toBeUndefined();

    expect(warnMock).toHaveBeenCalledWith(
      'audit.log.failed',
      expect.objectContaining({ action: 'sales.voided', resource: 'sale', error: 'db down' }),
    );
  });
});

describe('list', () => {
  const row = {
    id: 'log-1',
    action: 'marketplace.connected',
    resource: 'marketplace_connection',
    resourceId: null,
    userId: 'user-1',
    createdAt: new Date('2026-06-12T03:00:00.000Z'),
    user: { displayName: 'Willy', email: 'willy@example.com' },
  };

  it('queries org-scoped newest-first with the right skip/take and maps the actor name', async () => {
    prismaMock.auditLog.findMany.mockResolvedValue([row]);
    prismaMock.auditLog.count.mockResolvedValue(41);

    const result = await service.list(ORG, { page: 3, pageSize: 20 });

    expect(prismaMock.auditLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { organizationId: ORG },
        orderBy: { createdAt: 'desc' },
        skip: 40,
        take: 20,
      }),
    );
    expect(result.items).toEqual([
      {
        id: 'log-1',
        action: 'marketplace.connected',
        resource: 'marketplace_connection',
        resourceId: null,
        actorUserId: 'user-1',
        actorName: 'Willy',
        createdAt: '2026-06-12T03:00:00.000Z',
      },
    ]);
    expect(result.meta).toMatchObject({
      page: 3,
      pageSize: 20,
      total: 41,
      totalPages: 3,
      hasNextPage: false,
      hasPreviousPage: true,
    });
  });

  it('falls back to the actor email, then null for system events', async () => {
    prismaMock.auditLog.findMany.mockResolvedValue([
      { ...row, user: { displayName: null, email: 'willy@example.com' } },
      { ...row, id: 'log-2', userId: null, user: null },
    ]);
    prismaMock.auditLog.count.mockResolvedValue(2);

    const result = await service.list(ORG, { page: 1, pageSize: 20 });

    expect(result.items[0]?.actorName).toBe('willy@example.com');
    expect(result.items[1]).toMatchObject({ actorUserId: null, actorName: null });
  });
});
