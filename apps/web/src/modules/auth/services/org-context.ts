import 'server-only';

import { prisma } from '@falka/db';
import type { OrgRole } from '@prisma/client';

/**
 * The authoritative "which organization, which role" pair for a user — looked
 * up fresh per request (unique-indexed, sub-ms) instead of trusting the JWT
 * claims, so removing a member or changing a role takes effect immediately
 * even though tokens live 30 days.
 */
export type OrgContext = {
  id: string;
  role: OrgRole;
};

export async function resolveOrgContext(userId: string): Promise<OrgContext | null> {
  const membership = await prisma.organizationMember.findUnique({
    where: { userId },
    select: {
      organizationId: true,
      role: true,
      organization: { select: { deletedAt: true } },
    },
  });

  if (!membership || membership.organization.deletedAt) {
    return null;
  }

  return { id: membership.organizationId, role: membership.role };
}
