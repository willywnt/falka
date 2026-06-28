import { beforeEach, describe, expect, it, vi } from 'vitest';

import { currentAndPreviousMonth } from '@/modules/finance/utils/period';

const { prismaMock, generateForMonth, deriveFeesForMonth } = vi.hoisted(() => ({
  prismaMock: {
    organizationMember: { findMany: vi.fn() },
  },
  generateForMonth: vi.fn(),
  deriveFeesForMonth: vi.fn(),
}));

vi.mock('@palka/db', () => ({ prisma: prismaMock }));
vi.mock('@/lib/logger', () => ({
  appLogger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));
vi.mock('@/modules/finance/services/expense-template-server.service', () => ({
  expenseTemplateServerService: { generateForMonth },
}));
vi.mock('@/modules/finance/services/fee-server.service', () => ({
  feeServerService: { deriveFeesForMonth },
}));

const { FinanceAutogenService } =
  await import('@/modules/finance/services/finance-autogen.service');

const service = new FinanceAutogenService();
const NOW = new Date(Date.UTC(2026, 5, 1)); // 1 Jun 2026 UTC

beforeEach(() => {
  vi.clearAllMocks();
  prismaMock.organizationMember.findMany.mockResolvedValue([]);
  generateForMonth.mockResolvedValue({ month: '2026-06', created: 0, skipped: 0, total: 0 });
  deriveFeesForMonth.mockResolvedValue({ month: '2026-05', commissions: [], totalFee: '0' });
});

describe('currentAndPreviousMonth', () => {
  it('returns the current + previous YYYY-MM mid-year', () => {
    expect(currentAndPreviousMonth(new Date(Date.UTC(2026, 5, 15)))).toEqual({
      current: '2026-06',
      previous: '2026-05',
    });
  });

  it('rolls the year back at the January boundary', () => {
    expect(currentAndPreviousMonth(new Date(Date.UTC(2026, 0, 1)))).toEqual({
      current: '2026-01',
      previous: '2025-12',
    });
  });
});

describe('runMonthlyForAllOrgs', () => {
  it('generates THIS month + derives LAST month for every org, owner as actor', async () => {
    prismaMock.organizationMember.findMany.mockResolvedValue([
      { organizationId: 'org-1', userId: 'owner-1' },
      { organizationId: 'org-2', userId: 'owner-2' },
    ]);
    generateForMonth.mockResolvedValue({ month: '2026-06', created: 3, skipped: 0, total: 3 });

    const result = await service.runMonthlyForAllOrgs(NOW);

    // iterates OWNER members only
    expect(prismaMock.organizationMember.findMany.mock.calls[0]?.[0]).toMatchObject({
      where: { role: 'OWNER' },
    });
    // recurring = current month, fees = previous month, owner = actor
    expect(generateForMonth).toHaveBeenCalledWith('org-1', 'owner-1', '2026-06');
    expect(generateForMonth).toHaveBeenCalledWith('org-2', 'owner-2', '2026-06');
    expect(deriveFeesForMonth).toHaveBeenCalledWith('org-1', 'owner-1', '2026-05');
    expect(deriveFeesForMonth).toHaveBeenCalledWith('org-2', 'owner-2', '2026-05');
    expect(result).toEqual({
      recurringMonth: '2026-06',
      feeMonth: '2026-05',
      orgsProcessed: 2,
      orgsFailed: 0,
      recurringCreated: 6,
    });
  });

  it('isolates a failing org — the others still run', async () => {
    prismaMock.organizationMember.findMany.mockResolvedValue([
      { organizationId: 'bad', userId: 'o1' },
      { organizationId: 'good', userId: 'o2' },
    ]);
    generateForMonth.mockImplementation((organizationId: string) => {
      if (organizationId === 'bad') throw new Error('boom');
      return Promise.resolve({ month: '2026-06', created: 1, skipped: 0, total: 1 });
    });

    const result = await service.runMonthlyForAllOrgs(NOW);

    expect(result.orgsProcessed).toBe(1);
    expect(result.orgsFailed).toBe(1);
    expect(result.recurringCreated).toBe(1);
    expect(deriveFeesForMonth).toHaveBeenCalledWith('good', 'o2', '2026-05');
    // the failing org short-circuited before its fee derive
    expect(deriveFeesForMonth).not.toHaveBeenCalledWith('bad', 'o1', '2026-05');
  });

  it('no orgs → all zeros, no generation calls', async () => {
    const result = await service.runMonthlyForAllOrgs(NOW);
    expect(result).toMatchObject({ orgsProcessed: 0, orgsFailed: 0, recurringCreated: 0 });
    expect(generateForMonth).not.toHaveBeenCalled();
    expect(deriveFeesForMonth).not.toHaveBeenCalled();
  });
});
