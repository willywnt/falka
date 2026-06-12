import type { OrgRole, UserRole } from '@prisma/client';
import type { NextAuthConfig } from 'next-auth';

import { getAuthSessionCookieName, usesSecureAuthCookies } from '@/lib/auth-cookies';

export const AUTH_PAGES = {
  signIn: '/login',
  newUser: '/register',
} as const;

export const PROTECTED_ROUTE_PREFIXES = [
  '/dashboard',
  '/recordings',
  '/mobile',
  '/marketplace',
  '/settings',
] as const;

export const AUTH_ROUTE_PREFIXES = ['/login', '/register'] as const;

function isProtectedPath(pathname: string): boolean {
  // QR landing: auto sign-in via pairing code before connecting the scanner
  if (pathname === '/mobile/connect') {
    return false;
  }

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
    updateAge: 24 * 60 * 60,
  },
  cookies: {
    sessionToken: {
      name: getAuthSessionCookieName(),
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: usesSecureAuthCookies(),
        // Set AUTH_COOKIE_DOMAIN (e.g. ".example.com") in production so the
        // session cookie is shared with the separate Socket.IO subdomain
        // (socket.example.com). Unset in dev => host-only cookie (unchanged).
        domain: process.env.AUTH_COOKIE_DOMAIN?.trim() || undefined,
      },
    },
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
        // Org claims are a sign-in-time HINT; org-context re-resolves from the
        // DB per request so revocation doesn't wait out the 30-day token.
        token.organizationId = user.organizationId;
        token.orgRole = user.orgRole;
      }

      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.role = token.role as UserRole;
        session.user.displayName = (token.displayName as string | null | undefined) ?? null;
        session.user.organizationId = token.organizationId as string;
        session.user.orgRole = token.orgRole as OrgRole;
      }

      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
