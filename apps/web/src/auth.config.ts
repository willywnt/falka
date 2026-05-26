import type { UserRole } from '@prisma/client';
import type { NextAuthConfig } from 'next-auth';

export const AUTH_PAGES = {
  signIn: '/login',
  newUser: '/register',
} as const;

export const PROTECTED_ROUTE_PREFIXES = [
  '/dashboard',
  '/recordings',
  '/marketplace',
  '/settings',
] as const;

export const AUTH_ROUTE_PREFIXES = ['/login', '/register'] as const;

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function isAuthPath(pathname: string): boolean {
  return AUTH_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export const authConfig = {
  pages: AUTH_PAGES,
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },
  trustHost: true,
  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const isLoggedIn = Boolean(auth?.user);

      if (isProtectedPath(pathname)) {
        return isLoggedIn;
      }

      if (isLoggedIn && isAuthPath(pathname)) {
        return Response.redirect(new URL('/dashboard', request.nextUrl));
      }

      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.role = user.role;
        token.displayName = user.displayName;
      }

      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.role = token.role as UserRole;
        session.user.displayName = (token.displayName as string | null | undefined) ?? null;
      }

      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
