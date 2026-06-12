/** Role within an organization — mirrors the Prisma `OrgRole` enum. */
export type OrgRole = 'OWNER' | 'ADMIN' | 'STAFF';

export interface User {
  id: string;
  email: string;
  name: string;
  role: OrgRole;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Session {
  userId: string;
  organizationId: string;
  role: OrgRole;
  expiresAt: Date;
}

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface AuthTokenPayload {
  sub: string;
  orgId: string;
  role: OrgRole;
  iat: number;
  exp: number;
}
