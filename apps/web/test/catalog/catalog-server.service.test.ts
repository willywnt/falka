import { beforeEach, describe, expect, it, vi } from 'vitest';

import { archivedSku } from '@/modules/catalog/utils/variants';

/**
 * Catalog service orchestration (the risky mutating paths), with Prisma and the
 * cross-module services mocked. Guards the delete preflight (hard blockers vs soft
 * warnings), the soft-delete + bundle cascade, and variant restore's SKU-reclaim
 * rule (refuse when a live variant/bundle now owns the freed SKU).
 */

type TxClient = {
  productVariant: { update: ReturnType<typeof vi.fn> };
  product: { update: ReturnType<typeof vi.fn> };
};

const { prismaMock, txMock, mappingMock, returnsMock, bundleMock, takenSkusMock } = vi.hoisted(
  () => {
    const txMock: TxClient = {
      productVariant: { update: vi.fn() },
      product: { update: vi.fn() },
    };
    return {
      txMock,
      mappingMock: { getMappedVariantIds: vi.fn() },
      returnsMock: { getVariantIdsWithOpenReturns: vi.fn() },
      bundleMock: { cascadeBundleComponentRemoval: vi.fn() },
      takenSkusMock: vi.fn(),
      prismaMock: {
        product: { findFirst: vi.fn() },
        productVariant: { findFirst: vi.fn(), findMany: vi.fn(), update: vi.fn() },
        bundleItem: { findMany: vi.fn(), groupBy: vi.fn() },
        $transaction: vi.fn((cb: (tx: TxClient) => Promise<unknown>) => cb(txMock)),
      },
    };
  },
);

vi.mock('@falka/db', () => ({
  prisma: prismaMock,
  notDeleted: { deletedAt: null },
  buildPaginatedResult: (items: unknown[]) => ({ items, meta: {} }),
}));
vi.mock('@/lib/logger', () => ({
  appLogger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));
vi.mock('@/modules/audit/services/audit.service', () => ({ auditService: { log: vi.fn() } }));
vi.mock('@/modules/inventory/services/inventory-server.service', () => ({
  inventoryServerService: { ensureInventory: vi.fn() },
}));
vi.mock('@/modules/marketplace/services/marketplace-mapping.service', () => ({
  marketplaceMappingService: mappingMock,
}));
vi.mock('@/modules/returns/services/returns-server.service', () => ({
  returnsServerService: returnsMock,
}));
vi.mock('@/modules/storage/services/storage.service', () => ({ storageService: {} }));
vi.mock('@/modules/catalog/services/bundle-server.service', () => ({
  bundleServerService: bundleMock,
}));
vi.mock('@/modules/catalog/utils/sku', () => ({ takenSkus: takenSkusMock }));
vi.mock('@/modules/catalog/utils/storage', () => ({ deleteStorageObject: vi.fn() }));

const { CatalogServerService } = await import('@/modules/catalog/services/catalog-server.service');

const service = new CatalogServerService();
const ORG = 'org-1';
const USER = 'user-1';

/** A variant in the shape computeDeletionBlockers selects (id/sku/name + stock buckets). */
function blockerVariant(
  overrides: Partial<{
    reservedStock: number;
    incomingStock: number;
    availableStock: number;
    damagedStock: number;
  }> = {},
) {
  return {
    id: 'v1',
    sku: 'BLK-S',
    name: 'Black / S',
    inventory: {
      reservedStock: 0,
      incomingStock: 0,
      availableStock: 0,
      damagedStock: 0,
      ...overrides,
    },
  };
}

beforeEach(() => {
  prismaMock.product.findFirst.mockResolvedValue({ id: 'p1' }); // assertProductOwned passes
  mappingMock.getMappedVariantIds.mockResolvedValue(new Set());
  returnsMock.getVariantIdsWithOpenReturns.mockResolvedValue(new Set());
  prismaMock.bundleItem.findMany.mockResolvedValue([]);
  prismaMock.bundleItem.groupBy.mockResolvedValue([]);
  takenSkusMock.mockResolvedValue(new Set());
});

describe('restoreVariant', () => {
  it('reinstates the original SKU and clears deletedAt when the SKU is free', async () => {
    prismaMock.productVariant.findFirst.mockResolvedValue({
      id: 'v1',
      sku: archivedSku('KAOS-HTM-L', 'v1'),
    });
    takenSkusMock.mockResolvedValue(new Set());
    prismaMock.productVariant.update.mockResolvedValue({
      id: 'v1',
      productId: 'p1',
      sku: 'KAOS-HTM-L',
      name: 'Hitam / L',
      variantGroup: null,
      imageUrl: null,
      barcode: null,
      price: 50000,
      cost: null,
      weight: null,
      isActive: true,
      lowStockThreshold: 0,
      alertEnabled: false,
      leadTimeDays: null,
      minOrderQty: null,
      supplierId: null,
      labelPrintedAt: null,
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
      inventory: null,
    });

    const result = await service.restoreVariant(ORG, 'p1', 'v1');

    const args = prismaMock.productVariant.update.mock.calls[0]?.[0] as {
      data: { deletedAt: null; sku: string };
    };
    expect(args.data.deletedAt).toBeNull();
    expect(args.data.sku).toBe('KAOS-HTM-L');
    expect(result.sku).toBe('KAOS-HTM-L');
  });

  it('refuses when a live variant/bundle now owns the freed SKU', async () => {
    prismaMock.productVariant.findFirst.mockResolvedValue({
      id: 'v1',
      sku: archivedSku('KAOS-HTM-L', 'v1'),
    });
    takenSkusMock.mockResolvedValue(new Set(['KAOS-HTM-L']));

    await expect(service.restoreVariant(ORG, 'p1', 'v1')).rejects.toMatchObject({
      code: 'DUPLICATE_SKU',
    });
    expect(prismaMock.productVariant.update).not.toHaveBeenCalled();
  });

  it('throws notFound when the archived variant is missing', async () => {
    prismaMock.productVariant.findFirst.mockResolvedValue(null);

    await expect(service.restoreVariant(ORG, 'p1', 'v1')).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });
});

describe('deleteVariants', () => {
  it('blocks the delete when a target is mapped to a marketplace', async () => {
    prismaMock.productVariant.findMany.mockResolvedValue([blockerVariant()]);
    mappingMock.getMappedVariantIds.mockResolvedValue(new Set(['v1']));

    await expect(service.deleteVariants(ORG, USER, 'p1', ['v1'])).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
    });
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it('throws notFound when no live variant matches', async () => {
    prismaMock.productVariant.findMany.mockResolvedValue([]);

    await expect(service.deleteVariants(ORG, USER, 'p1', ['gone'])).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });

  it('archives the rows (freeing the SKU) and cascades into bundles', async () => {
    prismaMock.productVariant.findMany.mockResolvedValue([blockerVariant()]);

    await service.deleteVariants(ORG, USER, 'p1', ['v1']);

    const args = txMock.productVariant.update.mock.calls[0]?.[0] as {
      data: { deletedAt: Date; sku: string };
    };
    expect(args.data.deletedAt).toBeInstanceOf(Date);
    expect(args.data.sku).toBe(archivedSku('BLK-S', 'v1'));
    expect(bundleMock.cascadeBundleComponentRemoval).toHaveBeenCalledWith(
      txMock,
      ['v1'],
      expect.any(Date),
    );
  });
});

describe('getDeletionBlockers', () => {
  it('blocks on reserved stock', async () => {
    prismaMock.productVariant.findMany.mockResolvedValue([blockerVariant({ reservedStock: 2 })]);

    const result = await service.getDeletionBlockers(ORG, 'p1', ['v1']);

    expect(result.blocked).toBe(true);
    expect(result.reasons.join(' ')).toMatch(/reserved/i);
  });

  it('warns (not blocks) on on-hand + damaged stock', async () => {
    prismaMock.productVariant.findMany.mockResolvedValue([
      blockerVariant({ availableStock: 5, damagedStock: 1 }),
    ]);

    const result = await service.getDeletionBlockers(ORG, 'p1', ['v1']);

    expect(result.blocked).toBe(false);
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('warns about bundle membership and counts bundles that would be emptied', async () => {
    prismaMock.productVariant.findMany.mockResolvedValue([blockerVariant()]);
    prismaMock.bundleItem.findMany.mockResolvedValue([
      { bundleId: 'b1', bundle: { name: 'Paket OOTD' } },
    ]);
    // The bundle has exactly one component (the one being removed) → it would empty.
    prismaMock.bundleItem.groupBy.mockResolvedValue([{ bundleId: 'b1', _count: 1 }]);

    const result = await service.getDeletionBlockers(ORG, 'p1', ['v1']);

    expect(result.blocked).toBe(false);
    expect(result.warnings.join(' ')).toMatch(/bundel/i);
    expect(result.warnings.join(' ')).toMatch(/Paket OOTD/);
  });
});
