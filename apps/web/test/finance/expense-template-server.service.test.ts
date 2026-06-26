import { beforeEach, describe, expect, it, vi } from 'vitest';

const { prismaMock, auditMock } = vi.hoisted(() => ({
  prismaMock: {
    expenseTemplate: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    expense: { findMany: vi.fn(), createMany: vi.fn() },
  },
  auditMock: { log: vi.fn() },
}));

vi.mock('@falka/db', () => ({ prisma: prismaMock }));
vi.mock('@/lib/logger', () => ({
  appLogger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));
vi.mock('@/modules/audit/services/audit.service', () => ({ auditService: auditMock }));

const { ExpenseTemplateServerService } =
  await import('@/modules/finance/services/expense-template-server.service');

const service = new ExpenseTemplateServerService();
const ORG = 'org-1';
const USER = 'user-1';

function tpl(overrides: Record<string, unknown> = {}) {
  return {
    id: 't1',
    userId: USER,
    organizationId: ORG,
    category: 'RENT',
    amount: 1_000_000,
    dayOfMonth: 1,
    note: 'Sewa ruko',
    isActive: true,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    deletedAt: null,
    ...overrides,
  };
}

type CreateManyArg = { data: Array<Record<string, unknown>>; skipDuplicates?: boolean };

function createManyArg(): CreateManyArg {
  return prismaMock.expense.createMany.mock.calls[0]?.[0] as CreateManyArg;
}

beforeEach(() => {
  vi.clearAllMocks();
  prismaMock.expenseTemplate.findMany.mockResolvedValue([]);
  prismaMock.expenseTemplate.findFirst.mockResolvedValue(tpl());
  prismaMock.expenseTemplate.create.mockResolvedValue(tpl());
  prismaMock.expenseTemplate.update.mockResolvedValue(tpl());
  prismaMock.expense.findMany.mockResolvedValue([]);
  prismaMock.expense.createMany.mockResolvedValue({ count: 0 });
});

describe('generateForMonth', () => {
  it('does nothing when there are no active templates', async () => {
    prismaMock.expenseTemplate.findMany.mockResolvedValue([]);
    const result = await service.generateForMonth(ORG, USER, '2026-06');
    expect(result).toEqual({ month: '2026-06', created: 0, skipped: 0, total: 0 });
    expect(prismaMock.expense.createMany).not.toHaveBeenCalled();
  });

  it('queries only active, non-deleted templates for the org', async () => {
    await service.generateForMonth(ORG, USER, '2026-06');
    expect(prismaMock.expenseTemplate.findMany.mock.calls[0]?.[0]).toMatchObject({
      where: { organizationId: ORG, isActive: true, deletedAt: null },
    });
  });

  it('materializes each active template into a dated, idempotency-tagged expense', async () => {
    prismaMock.expenseTemplate.findMany.mockResolvedValue([
      tpl({ id: 't1', dayOfMonth: 1, category: 'RENT', amount: 1_000_000 }),
      tpl({ id: 't2', dayOfMonth: 25, category: 'SALARY', amount: 5_000_000 }),
    ]);
    prismaMock.expense.findMany.mockResolvedValue([]);
    prismaMock.expense.createMany.mockResolvedValue({ count: 2 });

    const result = await service.generateForMonth(ORG, USER, '2026-06');

    const arg = createManyArg();
    expect(arg.skipDuplicates).toBe(true);
    expect(arg.data).toHaveLength(2);
    expect(arg.data[0]).toMatchObject({
      templateId: 't1',
      periodMonth: '2026-06',
      category: 'RENT',
      organizationId: ORG,
      userId: USER,
      date: new Date(Date.UTC(2026, 5, 1)),
    });
    expect(arg.data[1]).toMatchObject({
      templateId: 't2',
      periodMonth: '2026-06',
      date: new Date(Date.UTC(2026, 5, 25)),
    });
    expect(result).toEqual({ month: '2026-06', created: 2, skipped: 0, total: 2 });
  });

  it('is idempotent — skips templates already generated for the month', async () => {
    prismaMock.expenseTemplate.findMany.mockResolvedValue([tpl({ id: 't1' }), tpl({ id: 't2' })]);
    prismaMock.expense.findMany.mockResolvedValue([{ templateId: 't1' }]);
    prismaMock.expense.createMany.mockResolvedValue({ count: 1 });

    const result = await service.generateForMonth(ORG, USER, '2026-06');

    const arg = createManyArg();
    expect(arg.data).toHaveLength(1);
    expect(arg.data[0]?.templateId).toBe('t2');
    expect(result).toEqual({ month: '2026-06', created: 1, skipped: 1, total: 2 });
  });

  it('clamps dayOfMonth to the last day of a short month (31 → Feb 28 in 2026)', async () => {
    prismaMock.expenseTemplate.findMany.mockResolvedValue([tpl({ id: 't1', dayOfMonth: 31 })]);
    prismaMock.expense.findMany.mockResolvedValue([]);
    prismaMock.expense.createMany.mockResolvedValue({ count: 1 });

    await service.generateForMonth(ORG, USER, '2026-02');

    expect(createManyArg().data[0]?.date).toEqual(new Date(Date.UTC(2026, 1, 28)));
  });

  it('respects a leap February (31 → Feb 29 in 2028)', async () => {
    prismaMock.expenseTemplate.findMany.mockResolvedValue([tpl({ id: 't1', dayOfMonth: 31 })]);
    prismaMock.expense.findMany.mockResolvedValue([]);
    prismaMock.expense.createMany.mockResolvedValue({ count: 1 });

    await service.generateForMonth(ORG, USER, '2028-02');

    expect(createManyArg().data[0]?.date).toEqual(new Date(Date.UTC(2028, 1, 29)));
  });
});

describe('template CRUD', () => {
  it('createTemplate persists org-scoped + defaults isActive true + audit-logs', async () => {
    prismaMock.expenseTemplate.create.mockResolvedValue(tpl({ id: 't9' }));
    const result = await service.createTemplate(ORG, USER, {
      category: 'RENT',
      amount: 1_000_000,
      dayOfMonth: 1,
      note: 'Sewa ruko',
    });

    expect(prismaMock.expenseTemplate.create.mock.calls[0]?.[0]).toMatchObject({
      data: { userId: USER, organizationId: ORG, category: 'RENT', dayOfMonth: 1, isActive: true },
    });
    expect(result).toMatchObject({ id: 't9', category: 'RENT', amount: '1000000', isActive: true });
    expect(auditMock.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'expense.template.created' }),
    );
  });

  it('listTemplates filters org + non-deleted, active first', async () => {
    await service.listTemplates(ORG);
    expect(prismaMock.expenseTemplate.findMany.mock.calls[0]?.[0]).toMatchObject({
      where: { organizationId: ORG, deletedAt: null },
      orderBy: [{ isActive: 'desc' }, { createdAt: 'desc' }],
    });
  });

  it('deleteTemplate soft-deletes; throws not-found for a cross-org id', async () => {
    const ok = await service.deleteTemplate(ORG, USER, 't1');
    expect(
      (prismaMock.expenseTemplate.update.mock.calls[0]?.[0] as { data: { deletedAt: unknown } })
        .data.deletedAt,
    ).toBeInstanceOf(Date);
    expect(ok).toEqual({ id: 't1' });

    prismaMock.expenseTemplate.findFirst.mockResolvedValue(null);
    await expect(service.deleteTemplate(ORG, USER, 'nope')).rejects.toThrow(/not found/i);
  });
});
