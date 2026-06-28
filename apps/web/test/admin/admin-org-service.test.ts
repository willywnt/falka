import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Platform admin-ops provisioning service, exercised against the real service
 * with Prisma + the password hasher + the audit trail mocked. Guards: the
 * Organization, OWNER User, and OWNER membership are created in ONE transaction;
 * a duplicate owner email is rejected before any write; plan/memberLimit fall
 * back to their defaults; config edits patch only the provided fields.
 */

const { prismaMock, hashMock, auditLogMock } = vi.hoisted(() => {
  const tx = {
    organization: { create: vi.fn() },
    user: { create: vi.fn() },
    organizationMember: { create: vi.fn() },
  };
  return {
    prismaMock: {
      tx,
      user: { findUnique: vi.fn() },
      organization: { findFirst: vi.fn(), update: vi.fn() },
      $transaction: vi.fn(async (run: (client: typeof tx) => unknown) => run(tx)),
    },
    hashMock: vi.fn(),
    auditLogMock: vi.fn(),
  };
});

vi.mock('@palka/db', () => ({ prisma: prismaMock }));
vi.mock('@palka/config/limits', () => ({ DEFAULT_STORAGE_QUOTA_BYTES: 500 }));
vi.mock('@/modules/auth/utils/password', () => ({ hashPassword: hashMock }));
vi.mock('@/modules/audit/services/audit.service', () => ({
  auditService: { log: auditLogMock },
}));

const { AdminOrgService } = await import('@/modules/admin/services/admin-org.service');

const service = new AdminOrgService();
const ACTOR = 'admin-1';

const validInput = {
  orgName: '  Toko Maju  ',
  owner: { email: '  Owner@Toko.COM ', displayName: '  Budi  ', password: 'secret-password' },
};

beforeEach(() => {
  vi.clearAllMocks();
  hashMock.mockResolvedValue('hashed');
  prismaMock.user.findUnique.mockResolvedValue(null);
  prismaMock.tx.organization.create.mockResolvedValue({ id: 'org-1' });
  prismaMock.tx.user.create.mockResolvedValue({ id: 'user-1' });
  prismaMock.tx.organizationMember.create.mockResolvedValue({ id: 'mem-1' });
  auditLogMock.mockResolvedValue(undefined);
});

describe('createOrganizationWithOwner', () => {
  it('creates org + OWNER user + OWNER membership in one transaction', async () => {
    const result = await service.createOrganizationWithOwner(validInput, ACTOR);

    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
    expect(prismaMock.tx.organization.create).toHaveBeenCalledTimes(1);
    expect(prismaMock.tx.user.create).toHaveBeenCalledTimes(1);
    expect(prismaMock.tx.organizationMember.create).toHaveBeenCalledWith({
      data: { organizationId: 'org-1', userId: 'user-1', role: 'OWNER' },
    });
    expect(result).toEqual({ organizationId: 'org-1', ownerUserId: 'user-1' });
  });

  it('normalizes the email, trims the org name + display name, and hashes the password', async () => {
    await service.createOrganizationWithOwner(validInput, ACTOR);

    expect(hashMock).toHaveBeenCalledWith('secret-password');
    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'owner@toko.com' },
      select: { id: true },
    });
    expect(prismaMock.tx.organization.create).toHaveBeenCalledWith({
      data: {
        name: 'Toko Maju',
        plan: 'FREE',
        memberLimit: null,
        storageQuotaBytes: BigInt(500),
      },
      select: { id: true },
    });
    expect(prismaMock.tx.user.create).toHaveBeenCalledWith({
      data: { email: 'owner@toko.com', passwordHash: 'hashed', displayName: 'Budi' },
      select: { id: true },
    });
  });

  it('defaults plan to FREE and memberLimit to null when omitted', async () => {
    await service.createOrganizationWithOwner(validInput, ACTOR);

    expect(prismaMock.tx.organization.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ plan: 'FREE', memberLimit: null }),
      }),
    );
  });

  it('honors an explicit plan + memberLimit', async () => {
    await service.createOrganizationWithOwner(
      { ...validInput, plan: 'PRO', memberLimit: 10 },
      ACTOR,
    );

    expect(prismaMock.tx.organization.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ plan: 'PRO', memberLimit: 10 }) }),
    );
  });

  it('rejects a duplicate owner email before any write', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: 'existing' });

    await expect(service.createOrganizationWithOwner(validInput, ACTOR)).rejects.toMatchObject({
      code: 'ADMIN_EMAIL_TAKEN',
    });
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
    expect(hashMock).not.toHaveBeenCalled();
  });

  it('logs the audit entry AFTER the transaction (best-effort)', async () => {
    await service.createOrganizationWithOwner(validInput, ACTOR);

    expect(auditLogMock).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: 'org-1',
        actorUserId: ACTOR,
        action: 'admin.org.created',
        resource: 'organization',
        resourceId: 'org-1',
      }),
    );
  });
});

describe('updateOrganizationConfig', () => {
  beforeEach(() => {
    prismaMock.organization.findFirst.mockResolvedValue({ id: 'org-1' });
    prismaMock.organization.update.mockResolvedValue({ id: 'org-1' });
  });

  it('patches only the provided fields and converts the quota to BigInt', async () => {
    await service.updateOrganizationConfig(
      'org-1',
      { plan: 'PRO', storageQuotaBytes: 1024 },
      ACTOR,
    );

    expect(prismaMock.organization.update).toHaveBeenCalledWith({
      where: { id: 'org-1' },
      data: { plan: 'PRO', storageQuotaBytes: BigInt(1024) },
    });
  });

  it('throws when the org is missing', async () => {
    prismaMock.organization.findFirst.mockResolvedValue(null);

    await expect(
      service.updateOrganizationConfig('ghost', { plan: 'PRO' }, ACTOR),
    ).rejects.toMatchObject({ code: 'ADMIN_ORG_NOT_FOUND' });
    expect(prismaMock.organization.update).not.toHaveBeenCalled();
  });
});
