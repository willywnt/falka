import { Prisma } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { prismaMock, salesMock, ordersMock, marketplaceMock, auditMock } = vi.hoisted(() => ({
  prismaMock: {
    organization: { findUnique: vi.fn(), update: vi.fn() },
    expense: { findFirst: vi.fn(), create: vi.fn(), update: vi.fn() },
  },
  salesMock: { sumQrisAmountForMonth: vi.fn() },
  ordersMock: { sumRevenueByConnectionForMonth: vi.fn() },
  marketplaceMock: { listConnections: vi.fn(), updateCommissionRate: vi.fn() },
  auditMock: { log: vi.fn() },
}));

vi.mock('@palka/db', () => ({ prisma: prismaMock }));
vi.mock('@/lib/logger', () => ({
  appLogger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));
vi.mock('@/modules/audit/services/audit.service', () => ({ auditService: auditMock }));
vi.mock('@/modules/sales/services/sales-server.service', () => ({ salesServerService: salesMock }));
vi.mock('@/modules/orders/services/orders-server.service', () => ({
  ordersServerService: ordersMock,
}));
vi.mock('@/modules/marketplace/services/marketplace-server.service', () => ({
  marketplaceServerService: marketplaceMock,
}));

const { FeeServerService } = await import('@/modules/finance/services/fee-server.service');

const service = new FeeServerService();
const ORG = 'org-1';
const USER = 'user-1';

function conn(overrides: Record<string, unknown> = {}) {
  return {
    id: 'c1',
    shopName: 'Toko A',
    provider: 'LAZADA',
    commissionRate: '5.00',
    ...overrides,
  };
}

type ExpenseCreateArg = { data: Record<string, unknown> };
type ExpenseUpdateArg = { where: { id: string }; data: Record<string, unknown> };

beforeEach(() => {
  vi.clearAllMocks();
  prismaMock.organization.findUnique.mockResolvedValue({ qrisFeeRate: 0 });
  prismaMock.expense.findFirst.mockResolvedValue(null);
  prismaMock.expense.create.mockResolvedValue({ id: 'new' });
  prismaMock.expense.update.mockResolvedValue({ id: 'upd' });
  salesMock.sumQrisAmountForMonth.mockResolvedValue(0);
  ordersMock.sumRevenueByConnectionForMonth.mockResolvedValue([]);
  marketplaceMock.listConnections.mockResolvedValue([]);
});

describe('deriveFeesForMonth — QRIS fee', () => {
  it('creates a PAYMENT_FEE expense = gross QRIS × rate, tagged for idempotency', async () => {
    prismaMock.organization.findUnique.mockResolvedValue({ qrisFeeRate: 0.7 });
    salesMock.sumQrisAmountForMonth.mockResolvedValue(10_000_000);

    const result = await service.deriveFeesForMonth(ORG, USER, '2026-06');

    const arg = prismaMock.expense.create.mock.calls[0]?.[0] as ExpenseCreateArg;
    expect(arg.data).toMatchObject({
      organizationId: ORG,
      userId: USER,
      category: 'PAYMENT_FEE',
      amount: 70000, // 10,000,000 × 0.7%
      autoSourceKey: 'qris-fee:2026-06',
      periodMonth: '2026-06',
    });
    expect(result.qris.fee).toBe('70000.00');
    expect(result.totalFee).toBe('70000.00');
  });

  it('rounds the fee to 2 decimals (rupiah)', async () => {
    prismaMock.organization.findUnique.mockResolvedValue({ qrisFeeRate: 0.7 });
    salesMock.sumQrisAmountForMonth.mockResolvedValue(1_234_567); // ×0.7% = 8641.969

    const result = await service.deriveFeesForMonth(ORG, USER, '2026-06');
    expect(result.qris.fee).toBe('8641.97');
  });

  it('updates an existing fee row instead of duplicating (idempotent re-run)', async () => {
    prismaMock.organization.findUnique.mockResolvedValue({ qrisFeeRate: 0.7 });
    salesMock.sumQrisAmountForMonth.mockResolvedValue(5_000_000);
    prismaMock.expense.findFirst.mockResolvedValue({ id: 'existing-qris' });

    await service.deriveFeesForMonth(ORG, USER, '2026-06');

    expect(prismaMock.expense.create).not.toHaveBeenCalled();
    const arg = prismaMock.expense.update.mock.calls[0]?.[0] as ExpenseUpdateArg;
    expect(arg.where).toEqual({ id: 'existing-qris' });
    expect(arg.data).toMatchObject({ amount: 35000, category: 'PAYMENT_FEE' });
  });

  it('soft-deletes a stale fee row when the rate is turned off (fee 0)', async () => {
    prismaMock.organization.findUnique.mockResolvedValue({ qrisFeeRate: 0 });
    salesMock.sumQrisAmountForMonth.mockResolvedValue(5_000_000);
    prismaMock.expense.findFirst.mockResolvedValue({ id: 'stale-qris' });

    const result = await service.deriveFeesForMonth(ORG, USER, '2026-06');

    expect(prismaMock.expense.create).not.toHaveBeenCalled();
    const arg = prismaMock.expense.update.mock.calls[0]?.[0] as ExpenseUpdateArg;
    expect(arg.where).toEqual({ id: 'stale-qris' });
    expect(arg.data.deletedAt).toBeInstanceOf(Date);
    expect(result.qris.fee).toBe('0.00');
  });

  it('converges (no 500) when a create races a concurrent derive (P2002)', async () => {
    prismaMock.organization.findUnique.mockResolvedValue({ qrisFeeRate: 0.7 });
    salesMock.sumQrisAmountForMonth.mockResolvedValue(1_000_000);
    // pre-create findFirst misses; the create loses the race (P2002); the retry findFirst sees the winner.
    prismaMock.expense.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 'raced-qris' });
    prismaMock.expense.create.mockRejectedValueOnce(
      new Prisma.PrismaClientKnownRequestError('unique', { code: 'P2002', clientVersion: 'test' }),
    );

    await service.deriveFeesForMonth(ORG, USER, '2026-06');

    const arg = prismaMock.expense.update.mock.calls[0]?.[0] as ExpenseUpdateArg;
    expect(arg.where).toEqual({ id: 'raced-qris' });
  });
});

describe('deriveFeesForMonth — marketplace commission', () => {
  it('derives commission per connection = fulfilled revenue × that rate', async () => {
    marketplaceMock.listConnections.mockResolvedValue([
      conn({ id: 'c1', shopName: 'Toko A', commissionRate: '5.00' }),
      conn({ id: 'c2', shopName: 'Toko B', commissionRate: '2.50' }),
    ]);
    ordersMock.sumRevenueByConnectionForMonth.mockResolvedValue([
      { connectionId: 'c1', revenue: 2_000_000 },
      { connectionId: 'c2', revenue: 1_000_000 },
    ]);

    const result = await service.deriveFeesForMonth(ORG, USER, '2026-06');

    const created = prismaMock.expense.create.mock.calls.map(
      (c) => (c[0] as ExpenseCreateArg).data,
    );
    expect(created).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          category: 'MARKETPLACE_COMMISSION',
          amount: 100000, // 2M × 5%
          autoSourceKey: 'mp-commission:c1:2026-06',
        }),
        expect.objectContaining({
          category: 'MARKETPLACE_COMMISSION',
          amount: 25000, // 1M × 2.5%
          autoSourceKey: 'mp-commission:c2:2026-06',
        }),
      ]),
    );
    expect(result.totalFee).toBe('125000.00');
    expect(result.commissions).toHaveLength(2);
  });

  it('skips connections with a zero rate', async () => {
    marketplaceMock.listConnections.mockResolvedValue([conn({ id: 'c1', commissionRate: '0' })]);
    ordersMock.sumRevenueByConnectionForMonth.mockResolvedValue([
      { connectionId: 'c1', revenue: 2_000_000 },
    ]);

    const result = await service.deriveFeesForMonth(ORG, USER, '2026-06');
    expect(prismaMock.expense.create).not.toHaveBeenCalled();
    expect(result.commissions).toHaveLength(0);
  });

  it('soft-deletes a stale commission row when a connection rate is turned OFF', async () => {
    // Rate dropped to 0 but a prior derive left a commission row — it must be cleaned, not orphaned.
    marketplaceMock.listConnections.mockResolvedValue([conn({ id: 'c1', commissionRate: '0' })]);
    ordersMock.sumRevenueByConnectionForMonth.mockResolvedValue([
      { connectionId: 'c1', revenue: 2_000_000 },
    ]);
    prismaMock.expense.findFirst.mockResolvedValue({ id: 'stale-comm' });

    const result = await service.deriveFeesForMonth(ORG, USER, '2026-06');

    expect(prismaMock.expense.create).not.toHaveBeenCalled();
    const updates = prismaMock.expense.update.mock.calls.map((c) => c[0] as ExpenseUpdateArg);
    expect(
      updates.some((u) => u.where.id === 'stale-comm' && u.data.deletedAt instanceof Date),
    ).toBe(true);
    expect(result.commissions).toHaveLength(0);
  });
});

describe('fee config', () => {
  it('updateFeeConfig writes the org QRIS rate + each connection rate via the marketplace service', async () => {
    marketplaceMock.listConnections.mockResolvedValue([conn()]);
    await service.updateFeeConfig(ORG, USER, {
      qrisFeeRate: 0.7,
      connectionRates: [{ connectionId: 'c1', commissionRate: 5 }],
    });

    expect(prismaMock.organization.update.mock.calls[0]?.[0]).toMatchObject({
      where: { id: ORG },
      data: { qrisFeeRate: 0.7 },
    });
    expect(marketplaceMock.updateCommissionRate).toHaveBeenCalledWith(ORG, USER, 'c1', 5);
  });

  it('getFeeConfig returns the org rate + connection rates', async () => {
    prismaMock.organization.findUnique.mockResolvedValue({ qrisFeeRate: 0.7 });
    marketplaceMock.listConnections.mockResolvedValue([conn({ id: 'c1', commissionRate: '5.00' })]);

    const config = await service.getFeeConfig(ORG);
    expect(config.qrisFeeRate).toBe('0.7');
    expect(config.connections).toEqual([
      { connectionId: 'c1', shopName: 'Toko A', provider: 'LAZADA', commissionRate: '5.00' },
    ]);
  });
});
