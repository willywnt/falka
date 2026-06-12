import type { DefaultSession } from 'next-auth';
import type { OrgRole, UserRole } from '@prisma/client';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      role: UserRole;
      displayName: string | null;
      organizationId: string;
      orgRole: OrgRole;
    } & DefaultSession['user'];
  }

  interface User {
    id: string;
    email: string;
    role: UserRole;
    displayName: string | null;
    organizationId: string;
    orgRole: OrgRole;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    email: string;
    role: UserRole;
    displayName: string | null;
    organizationId: string;
    orgRole: OrgRole;
  }
}

export {};
