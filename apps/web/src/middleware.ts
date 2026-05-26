import NextAuth, { type NextAuthResult } from 'next-auth';

import { authConfig } from '@/auth.config';

const { auth }: Pick<NextAuthResult, 'auth'> = NextAuth(authConfig);

export default auth;

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/recordings/:path*',
    '/marketplace/:path*',
    '/settings/:path*',
    '/login',
    '/register',
  ],
};
