import { beforeEach, describe, expect, it, vi } from 'vitest';

import { RECORDING_ERROR_CODES } from '@/modules/recordings/errors/recording-errors';
import { SALE_ERROR_CODES } from '@/modules/sales/errors/sale-errors';

/**
 * Cross-tenant isolation probe (HARD CONSTRAINT #6 — org-scope).
 *
 * Every domain read/write is scoped by `organizationId`, so when org-A asks for a
 * resource that belongs to org-B the org-scoped query finds NOTHING — the service must
 * reject (not-found), never return another org's row, and never mutate. We simulate the
 * foreign-org case (the scoped lookup returns null) and assert both the rejection AND
 * that the query actually carried the caller's `organizationId`. Together those prove the
 * boundary: the only way org-A could see org-B's row is an unscoped query, which would
 * make the `organizationId` assertion fail.
 *
 * This is the service-layer half of the probe; the full runtime check (a real second org,
 * hit by id over HTTP → 403/404) lives in the manual QA checklist.
 */

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    recording: { findFirst: vi.fn() },
    sale: { findFirst: vi.fn() },
    $transaction: vi.fn(),
  },
}));

vi.mock('@falka/db', () => ({ prisma: prismaMock, buildPaginatedResult: vi.fn() }));
vi.mock('@falka/config/env.server', () => ({
  getServerEnv: () => ({ R2_RECORDINGS_BUCKET_NAME: 'test-bucket' }),
}));
vi.mock('@falka/queue', () => ({ enqueuePropagateInventoryStock: vi.fn() }));
vi.mock('@/lib/logger', () => ({
  appLogger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));
vi.mock('@/modules/storage/services/quota.service', () => ({
  quotaService: { assertQuotaAvailable: vi.fn(), getQuotaSnapshot: vi.fn() },
}));
const storageMock = { deleteObject: vi.fn() };
vi.mock('@/modules/storage/services/storage.service', () => ({ storageService: storageMock }));
vi.mock('@/modules/inventory/services/inventory-server.service', () => ({
  inventoryServerService: {
    applyOfflineSaleTx: vi.fn(),
    applyOfflineSaleReversalTx: vi.fn(),
  },
}));
vi.mock('@/modules/catalog/services/catalog-server.service', () => ({
  catalogServerService: { resolveBundles: vi.fn() },
}));

// Imported after the mocks are registered.
const { RecordingServerService } =
  await import('@/modules/recordings/services/recording-server.service');
const { SalesServerService } = await import('@/modules/sales/services/sales-server.service');

const recordings = new RecordingServerService();
const sales = new SalesServerService();

const ORG_A = 'org-a';
const ACTOR_A = 'user-a';
const FOREIGN_ID = 'resource-owned-by-org-b';

beforeEach(() => {
  // The defining condition: org-A's org-scoped lookup for an org-B id resolves to null.
  prismaMock.recording.findFirst.mockResolvedValue(null);
  prismaMock.sale.findFirst.mockResolvedValue(null);
});

describe('cross-tenant isolation: reads refuse another org and stay org-scoped', () => {
  it('recordings.getRecordingById rejects a foreign-org id and scopes by organizationId', async () => {
    await expect(recordings.getRecordingById(ORG_A, ACTOR_A, FOREIGN_ID)).rejects.toMatchObject({
      code: RECORDING_ERROR_CODES.VALIDATION_ERROR,
    });

    const where = prismaMock.recording.findFirst.mock.calls[0]?.[0]?.where as {
      id: string;
      organizationId: string;
      deletedAt: null;
    };
    expect(where.organizationId).toBe(ORG_A);
    expect(where.id).toBe(FOREIGN_ID);
    expect(where.deletedAt).toBeNull();
  });

  it('sales.getSale rejects a foreign-org id and scopes by organizationId', async () => {
    await expect(sales.getSale(ORG_A, FOREIGN_ID)).rejects.toMatchObject({
      code: SALE_ERROR_CODES.NOT_FOUND,
    });

    const where = prismaMock.sale.findFirst.mock.calls[0]?.[0]?.where as {
      id: string;
      organizationId: string;
    };
    expect(where.organizationId).toBe(ORG_A);
    expect(where.id).toBe(FOREIGN_ID);
  });
});

describe('cross-tenant isolation: writes refuse another org before any side effect', () => {
  it('recordings.softDeleteRecording rejects a foreign-org id and never deletes the object or mutates', async () => {
    await expect(recordings.softDeleteRecording(ORG_A, ACTOR_A, FOREIGN_ID)).rejects.toMatchObject({
      code: RECORDING_ERROR_CODES.VALIDATION_ERROR,
    });

    const where = prismaMock.recording.findFirst.mock.calls[0]?.[0]?.where as {
      id: string;
      organizationId: string;
    };
    expect(where.organizationId).toBe(ORG_A);
    expect(storageMock.deleteObject).not.toHaveBeenCalled();
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });
});
