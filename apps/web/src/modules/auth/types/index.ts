import type { UserRole } from '@prisma/client';

export type { UserRole };

export type AuthUser = {
  id: string;
  email: string;
  role: UserRole;
  displayName: string | null;
};

export type AuthActionResult =
  | { success: true }
  | {
      success: false;
      code: string;
      message: string;
      fieldErrors?: Record<string, string[] | undefined>;
    };
