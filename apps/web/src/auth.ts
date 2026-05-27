import NextAuth, { type NextAuthResult } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { headers } from 'next/headers';
import { z } from 'zod';

import { authConfig } from '@/auth.config';
import { authService } from '@/modules/auth/services/auth.service';
import {
  isLoginBlocked,
  isSuspiciousLogin,
  recordFailedLoginAttempt,
  recordSuccessfulLogin,
} from '@/modules/auth/services/auth-security.service';
import { loginSchema } from '@/modules/auth/validators/login';
import { getRequestIp } from '@/lib/api/request-context';
import { logger } from '@olshop/logger/server';

const credentialsSchema = loginSchema.extend({
  email: z.string().email(),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut }: NextAuthResult = NextAuth({
  ...authConfig,
  secret: process.env.AUTH_SECRET,
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(rawCredentials) {
        const parsed = credentialsSchema.safeParse(rawCredentials);

        if (!parsed.success) {
          return null;
        }

        const headerStore = await headers();
        const ip = getRequestIp(new Request('http://local', { headers: headerStore }));

        if (await isLoginBlocked(parsed.data.email, ip)) {
          logger.warn('auth.login.blocked', { email: parsed.data.email, ip });
          return null;
        }

        if (await isSuspiciousLogin(parsed.data.email, ip)) {
          logger.warn('auth.login.suspicious', { email: parsed.data.email, ip });
        }

        try {
          const user = await authService.authenticateUser(parsed.data.email, parsed.data.password);

          recordSuccessfulLogin(user.id, ip);

          return {
            id: user.id,
            email: user.email,
            role: user.role,
            displayName: user.displayName,
          };
        } catch {
          await recordFailedLoginAttempt(parsed.data.email, ip);
          return null;
        }
      },
    }),
  ],
});
