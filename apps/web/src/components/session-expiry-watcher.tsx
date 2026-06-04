'use client';

import { useEffect } from 'react';

import { onUnauthorized } from '@/lib/api/fetch-client';

// Routes where a 401 is expected or where bouncing to login makes no sense
// (the user is already logged out, or completing their own auth flow).
const PUBLIC_PATH_PREFIXES = ['/login', '/register', '/mobile/connect'] as const;

function isPublicPath(pathname: string): boolean {
  if (pathname === '/') return true;
  return PUBLIC_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

// Bounces the user to /login (preserving where they were) the moment an API call
// reports the session has expired. Module-scoped so concurrent 401s — several
// queries failing at once — only trigger a single redirect.
let redirecting = false;

/**
 * Watches for session-expiry (401) signals from the fetch layer and redirects to
 * the login page, carrying the current URL as `callbackUrl` so the user returns
 * to where they were after signing back in.
 */
export function SessionExpiryWatcher() {
  useEffect(() => {
    return onUnauthorized(() => {
      if (redirecting) return;

      const { pathname, search } = window.location;
      if (isPublicPath(pathname)) return;

      redirecting = true;
      const callbackUrl = encodeURIComponent(`${pathname}${search}`);
      // Hard navigation: re-runs middleware and clears any stale client state.
      window.location.assign(`/login?callbackUrl=${callbackUrl}`);
    });
  }, []);

  return null;
}
