import NextAuth from 'next-auth';
import { NextResponse } from 'next/server';

import { authConfig, resolveRouteAccess } from '@/auth.config';
import { REQUEST_ID_HEADER, resolveRequestId } from '@/lib/correlation-edge';

const { auth } = NextAuth(authConfig);

// The custom-function form of `auth()` does NOT auto-enforce the `authorized` callback's
// `false` (only your return value is used), so gate unauthenticated/misplaced users here
// from the shared decision before falling through to request-id injection.
export default auth((request) => {
  const { nextUrl } = request;
  const decision = resolveRouteAccess(nextUrl.pathname, request.auth);

  if (decision.type === 'signin') {
    const loginUrl = new URL('/login', nextUrl);
    loginUrl.searchParams.set('callbackUrl', `${nextUrl.pathname}${nextUrl.search}`);
    return NextResponse.redirect(loginUrl);
  }

  if (decision.type === 'redirect') {
    return NextResponse.redirect(new URL(decision.to, nextUrl));
  }

  const requestId = resolveRequestId(request.headers.get(REQUEST_ID_HEADER));
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(REQUEST_ID_HEADER, requestId);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  response.headers.set(REQUEST_ID_HEADER, requestId);
  return response;
});

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/recordings/:path*',
    '/mobile/:path*',
    '/marketplace/:path*',
    '/settings/:path*',
    '/login',
    '/register',
    // Exclude Socket.IO engine path (handled by custom server in dev:web / start)
    '/api/((?!socket).*)',
  ],
};
