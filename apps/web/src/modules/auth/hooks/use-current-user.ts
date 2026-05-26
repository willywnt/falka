'use client';

import { useSession } from 'next-auth/react';

import type { AuthUser } from '@/modules/auth/types';

export function useCurrentUser() {
  const { data: session, status } = useSession();

  const user: AuthUser | null = session?.user
    ? {
        id: session.user.id,
        email: session.user.email,
        role: session.user.role,
        displayName: session.user.displayName ?? null,
      }
    : null;

  return {
    user,
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated',
  };
}
