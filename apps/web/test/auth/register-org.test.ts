import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Registration is invite-only (new orgs come from admin-ops). With Prisma,
 * password hashing, and the capacity guard mocked: a valid code is atomically
 * claimed and joins that org with the invite's role; a code that fails the
 * conditional claim (used/revoked/expired/unknown) rejects as invalid.
 */

const { prismaMock, txMock } = vi.hoisted(() => {
  const txMock = {
    user: { create: vi.fn() },
    organizationMember: { create: vi.fn() },
    organizationInvite: { updateMany: vi.fn(), findUnique: vi.fn() },
  };
  return {
    txMock,
    prismaMock: {
      user: { findUnique: vi.fn() },
      $transaction: vi.fn((cb: (tx: typeof txMock) => unknown) => cb(txMock)),
    },
  };
});

vi.mock('@falka/db', () => ({ prisma: prismaMock }));
vi.mock('@/modules/auth/utils/password', () => ({
  hashPassword: vi.fn(async () => 'hashed'),
  verifyPassword: vi.fn(async () => true),
}));
vi.mock('@/modules/users/services/member-capacity', () => ({
  assertMemberCapacity: vi.fn(async () => undefined),
}));

const { AuthService } = await import('@/modules/auth/services/auth.service');

const service = new AuthService();

beforeEach(() => {
  vi.clearAllMocks();
  prismaMock.user.findUnique.mockResolvedValue(null);
  txMock.user.create.mockResolvedValue({
    id: 'u-new',
    email: 'new@example.com',
    role: 'USER',
    displayName: 'Pendaftar',
  });
});

describe('registerUser — join via invite code', () => {
  it('claims the code and joins with the invite role, creating no org', async () => {
    txMock.organizationInvite.updateMany.mockResolvedValue({ count: 1 });
    txMock.organizationInvite.findUnique.mockResolvedValue({
      organizationId: 'org-host',
      role: 'STAFF',
    });
    txMock.organizationMember.create.mockResolvedValue({
      organizationId: 'org-host',
      role: 'STAFF',
    });

    const user = await service.registerUser({
      email: 'new@example.com',
      password: 'password123',
      inviteCode: 'abcd2345',
    });

    // Atomic claim keys off the uppercased code, gated on unused/unrevoked/unexpired.
    expect(txMock.organizationInvite.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ code: 'ABCD2345', usedAt: null, revokedAt: null }),
      }),
    );
    expect(txMock.organizationMember.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ organizationId: 'org-host', role: 'STAFF' }),
      }),
    );
    expect(user).toMatchObject({ organizationId: 'org-host', orgRole: 'STAFF' });
  });

  it('rejects when the code loses the claim race (count 0)', async () => {
    txMock.organizationInvite.updateMany.mockResolvedValue({ count: 0 });

    await expect(
      service.registerUser({
        email: 'new@example.com',
        password: 'password123',
        inviteCode: 'ABCD2345',
      }),
    ).rejects.toMatchObject({ code: 'INVALID_INVITE_CODE' });
    expect(txMock.organizationMember.create).not.toHaveBeenCalled();
  });
});
