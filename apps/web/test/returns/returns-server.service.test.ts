import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Returns/RMA service, exercised against the real service code with Prisma, the
 * queue, and the inventory service mocked. Guards: a return opens only after goods
 * shipped (idempotent), processing routes each line to restock vs damaged and marks
 * RECEIVED, restocks propagate while damaged does not, and reject closes with no
 * stock movement.
 */

type TxClient = {
  returnItem: { update: ReturnType<typeof vi.fn> };
  return: { update: ReturnType<typeof vi.fn> };
};

const { prismaMock, txMock, enqueueMock, inventoryMock } = vi.hoisted(() => {
  const txMock: TxClient = {
    returnItem: { update: vi.fn() },
    return: { update: vi.fn() },
  };
  return {
    txMock,
    enqueueMock: vi.fn(),
    inventoryMock: {
      applyReturnRestockTx: vi.fn().mockResolvedValue(0),
      applyReturnDamagedTx: vi.fn().mockResolvedValue(0),
    },
    prismaMock: {
      order: { findFirst: vi.fn() },
      return: { findFirst: vi.fn(), findMany: vi.fn(), create: vi.fn() },
      inventory: { findUnique: vi.fn() },
      marketplaceProductMapping: { count: vi.fn() },
      $transaction: vi.fn((cb: (tx: TxClient) => Promise<unknown>) => cb(txMock)),
    },
  };
});

vi.mock('@falka/db', () => ({ prisma: prismaMock }));
vi.mock('@falka/queue', () => ({ enqueuePropagateInventoryStock: enqueueMock }));
vi.mock('@/lib/logger', () => ({
  appLogger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));
vi.mock('@/modules/inventory/services/inventory-server.service', () => ({
  inventoryServerService: inventoryMock,
}));

const { ReturnsServerService } = await import('@/modules/returns/services/returns-server.service');

const service = new ReturnsServerService();
const USER = 'user-1';
// getReturn re-fetches for the response shape; stub it so tests assert behavior, not mapping.
const getReturnSpy = vi
  .spyOn(service, 'getReturn')
  .mockResolvedValue({ id: 'r1' } as Awaited<ReturnType<typeof service.getReturn>>);

beforeEach(() => {
  prismaMock.marketplaceProductMapping.count.mockResolvedValue(1);
  prismaMock.inventory.findUnique.mockResolvedValue({ availableStock: 5 });
  prismaMock.return.create.mockResolvedValue({ id: 'r1' });
  txMock.returnItem.update.mockResolvedValue({});
  txMock.return.update.mockResolvedValue({});
});

describe('createReturn', () => {
  const shippedOrder = {
    id: 'o1',
    userId: USER,
    noResi: 'RESI-1',
    inventoryShippedAt: new Date('2026-01-12T00:00:00.000Z'),
    items: [{ id: 'oi1', productVariantId: 'v1', quantity: 2 }],
  };

  it('rejects opening a return before the order has shipped', async () => {
    prismaMock.order.findFirst.mockResolvedValue({ ...shippedOrder, inventoryShippedAt: null });

    await expect(service.createReturn(USER, 'o1')).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
    });
    expect(prismaMock.return.create).not.toHaveBeenCalled();
  });

  it('creates a PENDING return with one line per resolved item', async () => {
    prismaMock.order.findFirst.mockResolvedValue(shippedOrder);
    prismaMock.return.findFirst.mockResolvedValue(null); // no existing return

    await service.createReturn(USER, 'o1', { autoDetected: true });

    const createArgs = prismaMock.return.create.mock.calls[0]?.[0] as {
      data: { autoDetected: boolean; noResi: string; items: { create: unknown[] } };
    };
    expect(createArgs.data.autoDetected).toBe(true);
    expect(createArgs.data.noResi).toBe('RESI-1');
    expect(createArgs.data.items.create).toHaveLength(1);
    expect(getReturnSpy).toHaveBeenCalled();
  });

  it('is idempotent — returns the existing return instead of creating a duplicate', async () => {
    prismaMock.order.findFirst.mockResolvedValue(shippedOrder);
    prismaMock.return.findFirst.mockResolvedValue({ id: 'existing' });

    await service.createReturn(USER, 'o1', { autoDetected: true });

    expect(prismaMock.return.create).not.toHaveBeenCalled();
    expect(getReturnSpy).toHaveBeenCalledWith(USER, 'existing');
  });
});

describe('processReturn', () => {
  const pendingReturn = {
    id: 'r1',
    userId: USER,
    status: 'PENDING',
    items: [
      { id: 'ri1', productVariantId: 'v1', quantity: 2 },
      { id: 'ri2', productVariantId: 'v2', quantity: 1 },
    ],
  };

  it('restocks and damages per line, marks RECEIVED, and propagates only the restock', async () => {
    prismaMock.return.findFirst.mockResolvedValue(pendingReturn);

    await service.processReturn(USER, 'r1', {
      lines: [
        { returnItemId: 'ri1', disposition: 'RESTOCK' },
        { returnItemId: 'ri2', disposition: 'DAMAGED' },
      ],
    });

    expect(inventoryMock.applyReturnRestockTx).toHaveBeenCalledTimes(1);
    expect(inventoryMock.applyReturnRestockTx).toHaveBeenCalledWith(
      txMock,
      expect.objectContaining({ variantId: 'v1', quantity: 2, returnId: 'r1' }),
    );
    expect(inventoryMock.applyReturnDamagedTx).toHaveBeenCalledTimes(1);
    const updateArgs = txMock.return.update.mock.calls[0]?.[0] as { data: { status: string } };
    expect(updateArgs.data.status).toBe('RECEIVED');
    // Only the restocked variant (v1) is propagated; the damaged one is not.
    expect(enqueueMock).toHaveBeenCalledTimes(1);
    expect(enqueueMock.mock.calls[0]?.[0]).toMatchObject({ variantId: 'v1' });
  });

  it('requires a disposition for every item', async () => {
    prismaMock.return.findFirst.mockResolvedValue(pendingReturn);

    await expect(
      service.processReturn(USER, 'r1', {
        lines: [{ returnItemId: 'ri1', disposition: 'RESTOCK' }],
      }),
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR' });
    expect(inventoryMock.applyReturnRestockTx).not.toHaveBeenCalled();
  });

  it('rejects processing a return that is not PENDING', async () => {
    prismaMock.return.findFirst.mockResolvedValue({ ...pendingReturn, status: 'RECEIVED' });

    await expect(
      service.processReturn(USER, 'r1', {
        lines: [{ returnItemId: 'ri1', disposition: 'RESTOCK' }],
      }),
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR' });
  });
});
