import 'server-only';

import type { Prisma, PrismaClient } from '@prisma/client';

import { AppError } from '@/lib/errors';

type Db = PrismaClient | Prisma.TransactionClient;

/**
 * Enforce an org's `memberLimit` (the subscription hook): a seat is taken by an
 * active member OR a still-usable invite. null limit = unlimited. Called before
 * minting an invite and when a code is redeemed, so a plan cap can't be
 * over-filled even if the limit is lowered after invites went out.
 */
export async function assertMemberCapacity(client: Db, organizationId: string): Promise<void> {
  const org = await client.organization.findUnique({
    where: { id: organizationId },
    select: { memberLimit: true },
  });

  if (!org?.memberLimit) return;

  const [members, pendingInvites] = await Promise.all([
    client.organizationMember.count({ where: { organizationId } }),
    client.organizationInvite.count({
      where: { organizationId, usedAt: null, revokedAt: null, expiresAt: { gt: new Date() } },
    }),
  ]);

  if (members + pendingInvites >= org.memberLimit) {
    throw AppError.validation(
      'Batas anggota organisasi sudah tercapai. Minta pemilik menaikkan paketnya dulu.',
    );
  }
}
