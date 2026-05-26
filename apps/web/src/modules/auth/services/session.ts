import 'server-only';

import type { UserRole } from '@prisma/client';
import { redirect } from 'next/navigation';

import { auth } from '@/auth';

import { AuthError } from '../errors/auth-errors';
import type { AuthUser } from '../types';

export async function getCurrentUser(): Promise<AuthUser | null> {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  return {
    id: session.user.id,
    email: session.user.email,
    role: session.user.role,
    displayName: session.user.displayName ?? null,
  };
}

export async function requireAuth(): Promise<AuthUser> {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  return user;
}

export async function requireRole(...roles: UserRole[]): Promise<AuthUser> {
  const user = await requireAuth();

  if (!roles.includes(user.role)) {
    throw AuthError.forbidden();
  }

  return user;
}
