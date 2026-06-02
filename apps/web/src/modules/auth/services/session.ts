import 'server-only';

import type { UserRole } from '@prisma/client';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { auth } from '@/auth';
import { resolveAuthToken } from '@/lib/resolve-auth-token.server';

import type { AuthUser } from '../types';

function userFromToken(token: {
  id?: string;
  email?: string | null;
  role?: UserRole;
  displayName?: string | null;
}): AuthUser | null {
  if (!token.id || typeof token.id !== 'string') {
    return null;
  }

  return {
    id: token.id,
    email: (token.email as string) ?? '',
    role: (token.role as UserRole) ?? 'USER',
    displayName: (token.displayName as string | null | undefined) ?? null,
  };
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const session = await auth();

  if (session?.user?.id) {
    return {
      id: session.user.id,
      email: session.user.email,
      role: session.user.role,
      displayName: session.user.displayName ?? null,
    };
  }

  const headerStore = await headers();
  const token = await resolveAuthToken({ headers: headerStore });

  return token ? userFromToken(token) : null;
}

export async function requireAuth(): Promise<AuthUser> {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  return user;
}
