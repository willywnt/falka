import type { OrgRole } from '@prisma/client';

/*
 * Org-role ranking, shared by server guards (withApiRoute/requireOrgRole) and
 * client UI gating (useOrg + orgRoleAtLeast) — ONE source so they can't drift.
 * Type-only Prisma import keeps this safe to bundle client-side.
 */

const RANK: Record<OrgRole, number> = {
  STAFF: 0,
  ADMIN: 1,
  OWNER: 2,
};

export function orgRoleAtLeast(role: OrgRole, min: OrgRole): boolean {
  return RANK[role] >= RANK[min];
}

/** Indonesian display label for an org role. */
export function orgRoleLabel(role: OrgRole): string {
  switch (role) {
    case 'OWNER':
      return 'Pemilik';
    case 'ADMIN':
      return 'Admin';
    case 'STAFF':
      return 'Staf';
  }
}
