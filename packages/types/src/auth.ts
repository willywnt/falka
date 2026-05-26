export type UserRole = 'owner' | 'admin' | 'member' | 'viewer';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Session {
  userId: string;
  organizationId: string;
  role: UserRole;
  expiresAt: Date;
}

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface AuthTokenPayload {
  sub: string;
  orgId: string;
  role: UserRole;
  iat: number;
  exp: number;
}
