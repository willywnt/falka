import 'server-only';

import { prisma } from '@falka/db';
import type { OrgRole, UserRole } from '@prisma/client';

import { assertMemberCapacity } from '@/modules/users/services/member-capacity';

import { AuthError } from '../errors/auth-errors';
import type { AuthUser } from '../types';
import { hashPassword, verifyPassword } from '../utils/password';

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

type UserWithMembership = {
  id: string;
  email: string;
  role: UserRole;
  displayName: string | null;
  membership: { organizationId: string; role: OrgRole } | null;
};

/** Org membership is part of identity now — no membership, no session. */
function toAuthUser(user: UserWithMembership): AuthUser {
  if (!user.membership) {
    throw AuthError.accessRevoked();
  }

  return {
    id: user.id,
    email: user.email,
    role: user.role,
    displayName: user.displayName,
    organizationId: user.membership.organizationId,
    orgRole: user.membership.role,
  };
}

const MEMBERSHIP_SELECT = {
  select: { organizationId: true, role: true },
} as const;

export class AuthService {
  async authenticateUser(email: string, password: string): Promise<AuthUser> {
    const normalizedEmail = normalizeEmail(email);

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        email: true,
        role: true,
        displayName: true,
        passwordHash: true,
        deletedAt: true,
        membership: MEMBERSHIP_SELECT,
      },
    });

    if (!user || user.deletedAt) {
      throw AuthError.invalidCredentials();
    }

    const isValidPassword = await verifyPassword(user.passwordHash, password);

    if (!isValidPassword) {
      throw AuthError.invalidCredentials();
    }

    return toAuthUser(user);
  }

  /**
   * Registration is invite-only: new organizations are provisioned by the
   * platform admin-ops console, so the public path only JOINS an existing org.
   * One transaction creates the user, atomically claims the (single-use,
   * unexpired) code, enforces the org's member cap, and adds the membership
   * with the code's role.
   */
  async registerUser(input: {
    email: string;
    password: string;
    displayName?: string;
    inviteCode: string;
  }): Promise<AuthUser> {
    const normalizedEmail = normalizeEmail(input.email);
    const inviteCode = input.inviteCode.trim().toUpperCase();

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });

    if (existingUser) {
      throw AuthError.emailTaken();
    }

    const passwordHash = await hashPassword(input.password);
    const displayName = input.displayName?.trim() || null;

    return prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { email: normalizedEmail, passwordHash, displayName },
        select: { id: true, email: true, role: true, displayName: true },
      });

      // Atomic claim: only an unused, unrevoked, unexpired code flips to used.
      // count 0 means the code lost the race or never qualified.
      const claim = await tx.organizationInvite.updateMany({
        where: { code: inviteCode, usedAt: null, revokedAt: null, expiresAt: { gt: new Date() } },
        data: { usedAt: new Date(), usedByUserId: user.id },
      });

      if (claim.count === 0) {
        throw AuthError.invalidInviteCode();
      }

      const invite = await tx.organizationInvite.findUnique({
        where: { code: inviteCode },
        select: { organizationId: true, role: true },
      });

      if (!invite) {
        throw AuthError.invalidInviteCode();
      }

      // Respect the org's plan cap even if the limit was lowered after the code
      // went out (the just-claimed code no longer counts as a pending seat).
      await assertMemberCapacity(tx, invite.organizationId);

      const membership = await tx.organizationMember.create({
        data: { organizationId: invite.organizationId, userId: user.id, role: invite.role },
        select: { organizationId: true, role: true },
      });

      return toAuthUser({ ...user, membership });
    });
  }

  /** Change the signed-in user's own password after verifying their current one. */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true, deletedAt: true },
    });

    if (!user || user.deletedAt) {
      throw AuthError.unauthorized();
    }

    const isValidPassword = await verifyPassword(user.passwordHash, currentPassword);
    if (!isValidPassword) {
      throw AuthError.unauthorized('Password lama salah.');
    }

    const passwordHash = await hashPassword(newPassword);
    await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  }

  /** Read-only last-login info for the Settings security view (time + IP). */
  async getSecurityInfo(
    userId: string,
  ): Promise<{ lastLoginAt: string | null; lastLoginIp: string | null }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { lastLoginAt: true, lastLoginIp: true },
    });

    return {
      lastLoginAt: user?.lastLoginAt?.toISOString() ?? null,
      lastLoginIp: user?.lastLoginIp ?? null,
    };
  }
}

export const authService = new AuthService();
