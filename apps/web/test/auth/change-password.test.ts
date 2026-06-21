import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Self-service password change + last-login read, with Prisma + the argon2 helpers
 * mocked. Guards: changePassword verifies the CURRENT password before storing the new
 * hash, and refuses (UNAUTHORIZED, no write) on a wrong current password or a
 * missing/deleted user; getSecurityInfo maps the stored last-login fields.
 */

const { prismaMock, verifyMock, hashMock } = vi.hoisted(() => ({
  prismaMock: { user: { findUnique: vi.fn(), update: vi.fn() } },
  verifyMock: vi.fn(),
  hashMock: vi.fn(),
}));

vi.mock('@falka/db', () => ({ prisma: prismaMock }));
vi.mock('@/modules/auth/utils/password', () => ({
  hashPassword: hashMock,
  verifyPassword: verifyMock,
}));
vi.mock('@/modules/users/services/member-capacity', () => ({
  assertMemberCapacity: vi.fn(async () => undefined),
}));

const { AuthService } = await import('@/modules/auth/services/auth.service');

const service = new AuthService();

beforeEach(() => {
  vi.clearAllMocks();
  prismaMock.user.findUnique.mockResolvedValue({ passwordHash: 'old-hash', deletedAt: null });
  prismaMock.user.update.mockResolvedValue({});
  verifyMock.mockResolvedValue(true);
  hashMock.mockResolvedValue('new-hash');
});

describe('changePassword', () => {
  it('verifies the current password then stores the new hash', async () => {
    await service.changePassword('u1', 'oldpass', 'newpass123');

    expect(verifyMock).toHaveBeenCalledWith('old-hash', 'oldpass');
    expect(hashMock).toHaveBeenCalledWith('newpass123');
    expect(prismaMock.user.update.mock.calls[0]?.[0]).toMatchObject({
      where: { id: 'u1' },
      data: { passwordHash: 'new-hash' },
    });
  });

  it('refuses a wrong current password (no write)', async () => {
    verifyMock.mockResolvedValue(false);

    await expect(service.changePassword('u1', 'wrong', 'newpass123')).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
    });
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });

  it('refuses when the user is missing or deleted', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    await expect(service.changePassword('u1', 'x', 'newpass123')).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
    });
    expect(hashMock).not.toHaveBeenCalled();
  });
});

describe('getSecurityInfo', () => {
  it('maps the stored last-login fields to ISO + ip', async () => {
    const when = new Date('2026-06-21T03:00:00.000Z');
    prismaMock.user.findUnique.mockResolvedValue({ lastLoginAt: when, lastLoginIp: '1.2.3.4' });

    const info = await service.getSecurityInfo('u1');

    expect(info).toEqual({ lastLoginAt: when.toISOString(), lastLoginIp: '1.2.3.4' });
  });

  it('returns nulls when never logged in', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ lastLoginAt: null, lastLoginIp: null });

    expect(await service.getSecurityInfo('u1')).toEqual({ lastLoginAt: null, lastLoginIp: null });
  });
});
