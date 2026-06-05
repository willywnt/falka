import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Purchasing service, exercised against the real service with Prisma, the queue,
 * and the inventory service mocked. Guards: create bumps incoming per line; receive
 * moves incoming→available and recomputes status (partial vs full) + propagates;
 * cancel removes outstanding incoming; searchVariants maps.
 */

type TxClient = {
  purchaseOrder: {
    count: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
  purchaseOrderItem: { update: ReturnType<typeof vi.fn> };
};

const { prismaMock, txMock, enqueueMock, inventoryMock } = vi.hoisted(() => {
  const txMock: TxClient = {
    purchaseOrder: { count: vi.fn(), create: vi.fn(), update: vi.fn() },
    purchaseOrderItem: { update: vi.fn() },
  };
  return {
    txMock,
    enqueueMock: vi.fn(),
    inventoryMock: {
      adjustIncomingTx: vi.fn().mockResolvedValue(undefined),
      applyPurchaseReceiveTx: vi.fn().mockResolvedValue(0),
    },
    prismaMock: {
      productVariant: { findMany: vi.fn() },
      purchaseOrder: { findMany: vi.fn(), findFirst: vi.fn() },
      inventory: { findUnique: vi.fn() },
      marketplaceProductMapping: { count: vi.fn() },
      $transaction: vi.fn((cb: (tx: TxClient) => Promise<unknown>) => cb(txMock)),
    },
  };
});

vi.mock('@olshop/db', () => ({ prisma: prismaMock }));
vi.mock('@olshop/queue', () => ({ enqueuePropagateInventoryStock: enqueueMock }));
vi.mock('@/lib/logger', () => ({
  appLogger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));
vi.mock('@/modules/inventory/services/inventory-server.service', () => ({
  inventoryServerService: inventoryMock,
}));

const { PurchasingServerService } =
  await import('@/modules/purchasing/services/purchasing-server.service');

const service = new PurchasingServerService();
const USER = 'user-1';
const getSpy = vi
  .spyOn(service, 'getPurchaseOrder')
  .mockResolvedValue({ id: 'po1' } as Awaited<ReturnType<typeof service.getPurchaseOrder>>);

beforeEach(() => {
  prismaMock.marketplaceProductMapping.count.mockResolvedValue(1);
  prismaMock.inventory.findUnique.mockResolvedValue({ availableStock: 20 });
  txMock.purchaseOrder.count.mockResolvedValue(0);
  txMock.purchaseOrder.create.mockResolvedValue({ id: 'po1', code: 'PO00001' });
  txMock.purchaseOrder.update.mockResolvedValue({});
  txMock.purchaseOrderItem.update.mockResolvedValue({});
});

describe('createPurchaseOrder', () => {
  it('snapshots the variant, sets the total, and bumps incoming per line', async () => {
    prismaMock.productVariant.findMany.mockResolvedValue([
      { id: 'v1', sku: 'BLACK-S', name: 'Black / S' },
    ]);

    await service.createPurchaseOrder(USER, {
      items: [{ variantId: 'v1', quantity: 20, unitCost: 50_000 }],
    });

    const args = txMock.purchaseOrder.create.mock.calls[0]?.[0] as {
      data: { code: string; totalCost: number; items: { create: Array<{ sku: string }> } };
    };
    expect(args.data.code).toBe('PO00001');
    expect(args.data.totalCost).toBe(1_000_000);
    expect(args.data.items.create[0]?.sku).toBe('BLACK-S');
    expect(inventoryMock.adjustIncomingTx).toHaveBeenCalledWith(
      txMock,
      expect.objectContaining({ variantId: 'v1', delta: 20 }),
    );
    expect(getSpy).toHaveBeenCalledWith(USER, 'po1');
  });
});

describe('receivePurchaseOrder', () => {
  const orderedPo = {
    id: 'po1',
    status: 'ORDERED',
    items: [{ id: 'poi1', productVariantId: 'v1', quantity: 20, receivedQuantity: 0 }],
  };

  it('receives partially → PARTIALLY_RECEIVED, moves incoming→available, propagates', async () => {
    prismaMock.purchaseOrder.findFirst.mockResolvedValue(orderedPo);

    await service.receivePurchaseOrder(USER, 'po1', {
      lines: [{ purchaseOrderItemId: 'poi1', quantity: 5 }],
    });

    expect(inventoryMock.applyPurchaseReceiveTx).toHaveBeenCalledWith(
      txMock,
      expect.objectContaining({ variantId: 'v1', quantity: 5, purchaseOrderId: 'po1' }),
    );
    const updateArgs = txMock.purchaseOrder.update.mock.calls[0]?.[0] as {
      data: { status: string };
    };
    expect(updateArgs.data.status).toBe('PARTIALLY_RECEIVED');
    expect(enqueueMock).toHaveBeenCalledTimes(1);
  });

  it('receives the remainder → RECEIVED + receivedAt', async () => {
    prismaMock.purchaseOrder.findFirst.mockResolvedValue(orderedPo);

    await service.receivePurchaseOrder(USER, 'po1', {
      lines: [{ purchaseOrderItemId: 'poi1', quantity: 20 }],
    });

    const updateArgs = txMock.purchaseOrder.update.mock.calls[0]?.[0] as {
      data: { status: string; receivedAt: Date | null };
    };
    expect(updateArgs.data.status).toBe('RECEIVED');
    expect(updateArgs.data.receivedAt).toBeInstanceOf(Date);
  });

  it('rejects receiving when nothing is outstanding', async () => {
    prismaMock.purchaseOrder.findFirst.mockResolvedValue({
      ...orderedPo,
      items: [{ id: 'poi1', productVariantId: 'v1', quantity: 20, receivedQuantity: 20 }],
    });

    await expect(
      service.receivePurchaseOrder(USER, 'po1', {
        lines: [{ purchaseOrderItemId: 'poi1', quantity: 5 }],
      }),
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR' });
    expect(inventoryMock.applyPurchaseReceiveTx).not.toHaveBeenCalled();
  });
});

describe('cancelPurchaseOrder', () => {
  it('removes the outstanding incoming and marks CANCELLED', async () => {
    prismaMock.purchaseOrder.findFirst.mockResolvedValue({
      id: 'po1',
      status: 'ORDERED',
      items: [{ id: 'poi1', productVariantId: 'v1', quantity: 20, receivedQuantity: 5 }],
    });

    await service.cancelPurchaseOrder(USER, 'po1');

    expect(inventoryMock.adjustIncomingTx).toHaveBeenCalledWith(
      txMock,
      expect.objectContaining({ variantId: 'v1', delta: -15 }),
    );
    const updateArgs = txMock.purchaseOrder.update.mock.calls[0]?.[0] as {
      data: { status: string };
    };
    expect(updateArgs.data.status).toBe('CANCELLED');
  });
});

describe('searchVariants', () => {
  it('maps variants with cost + available/incoming', async () => {
    prismaMock.productVariant.findMany.mockResolvedValue([
      {
        id: 'v1',
        sku: 'BLACK-S',
        name: 'Black / S',
        cost: 50_000,
        inventory: { availableStock: 5, incomingStock: 20 },
        product: { name: 'Cotton Tee' },
      },
    ]);

    const result = await service.searchVariants(USER, 'black');

    expect(result).toEqual([
      {
        variantId: 'v1',
        sku: 'BLACK-S',
        name: 'Black / S',
        productName: 'Cotton Tee',
        cost: '50000',
        availableStock: 5,
        incomingStock: 20,
      },
    ]);
  });
});
