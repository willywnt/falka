import type { OrgRole, UserRole } from '@prisma/client';

export type { OrgRole, UserRole };

export type AuthUser = {
  id: string;
  email: string;
  /** Platform role (ADMIN = app operator) — NOT the org role. */
  role: UserRole;
  displayName: string | null;
  /**
   * Org claims resolved at sign-in. These ride the JWT as a hint; the
   * authoritative pair is re-resolved from the DB per request (org-context),
   * so a removed member loses access immediately, not at token expiry.
   */
  organizationId: string;
  orgRole: OrgRole;
};

export type AuthActionResult =
  | { success: true }
  | {
      success: false;
      code: string;
      message: string;
      fieldErrors?: Record<string, string[] | undefined>;
    };
