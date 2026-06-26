import { beforeEach, describe, expect, it, vi } from 'vitest';

const { prismaMock, auditMock } = vi.hoisted(() => ({
  prismaMock: {
    expense: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
  auditMock: { log: vi.fn() },
}));

vi.mock('@falka/db', () => ({ prisma: prismaMock }));
vi.mock('@/lib/logger', () => ({
  appLogger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));
vi.mock('@/modules/audit/services/audit.service', () => ({ auditService: auditMock }));

const { ExpenseServerService } = await import('@/modules/finance/services/expense-server.service');

const service = new ExpenseServerService();
const ORG = 'org-1';
const USER = 'user-1';

function expenseRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'e1',
    userId: USER,
    organizationId: ORG,
    category: 'ADVERTISING',
    amount: 150000,
    date: new Date('2026-06-05T00:00:00.000Z'),
    note: 'FB ads',
    createdAt: new Date('2026-06-05T01:00:00.000Z'),
    updatedAt: new Date('2026-06-05T01:00:00.000Z'),
    deletedAt: null,
    ...overrides,
  };
}

beforeEach(() => {
  prismaMock.expense.findMany.mockResolvedValue([]);
  prismaMock.expense.findFirst.mockResolvedValue(expenseRow());
  prismaMock.expense.create.mockResolvedValue(expenseRow());
  prismaMock.expense.update.mockResolvedValue(expenseRow());
});

describe('expenseServerService.createExpense', () => {
  it('persists the org-scoped expense, maps it, and audit-logs', async () => {
    const date = new Date('2026-06-05T00:00:00.000Z');
    const result = await service.createExpense(ORG, USER, {
      category: 'ADVERTISING',
      amount: 150000,
      date,
      note: 'FB ads',
    });

    expect(prismaMock.expense.create.mock.calls[0]?.[0]).toMatchObject({
      data: { userId: USER, organizationId: ORG, category: 'ADVERTISING', amount: 150000, date },
    });
    expect(result).toMatchObject({
      id: 'e1',
      category: 'ADVERTISING',
      amount: '150000',
      note: 'FB ads',
    });
    expect(auditMock.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'expense.created', resource: 'expense' }),
    );
  });
});

describe('expenseServerService.deleteExpense', () => {
  it('soft-deletes (stamps deletedAt) an owned expense', async () => {
    const result = await service.deleteExpense(ORG, USER, 'e1');

    expect(prismaMock.expense.update.mock.calls[0]?.[0]).toMatchObject({
      where: { id: 'e1' },
    });
    const data = (prismaMock.expense.update.mock.calls[0]?.[0] as { data: { deletedAt: unknown } })
      .data;
    expect(data.deletedAt).toBeInstanceOf(Date);
    expect(result).toEqual({ id: 'e1' });
  });

  it('throws not-found for an expense outside the org', async () => {
    prismaMock.expense.findFirst.mockResolvedValue(null);
    await expect(service.deleteExpense(ORG, USER, 'nope')).rejects.toThrow(/not found/i);
    expect(prismaMock.expense.update).not.toHaveBeenCalled();
  });
});

describe('expenseServerService.listExpenses', () => {
  it('filters by org + non-deleted + the given category/date range', async () => {
    const from = new Date('2026-06-01T00:00:00.000Z');
    const to = new Date('2026-06-30T23:59:59.999Z');
    await service.listExpenses(ORG, { from, to, category: 'PACKAGING' });

    expect(prismaMock.expense.findMany.mock.calls[0]?.[0]).toMatchObject({
      where: {
        organizationId: ORG,
        deletedAt: null,
        category: 'PACKAGING',
        date: { gte: from, lte: to },
      },
    });
  });
});

describe('expenseServerService.listExpenseLines', () => {
  it('returns numeric amounts for report aggregation', async () => {
    prismaMock.expense.findMany.mockResolvedValue([expenseRow({ amount: 99000 })]);
    const lines = await service.listExpenseLines(
      ORG,
      new Date('2026-06-01'),
      new Date('2026-06-30'),
    );
    expect(lines).toEqual([
      { date: new Date('2026-06-05T00:00:00.000Z'), category: 'ADVERTISING', amount: 99000 },
    ]);
  });
});
