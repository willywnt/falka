import NextAuth, { type NextAuthResult } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';

import { authConfig } from '@/auth.config';
import { authService } from '@/modules/auth/services/auth.service';
import { loginSchema } from '@/modules/auth/validators/login';

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

        try {
          const user = await authService.authenticateUser(
            parsed.data.email,
            parsed.data.password,
          );

          return {
            id: user.id,
            email: user.email,
            role: user.role,
            displayName: user.displayName,
          };
        } catch {
          return null;
        }
      },
    }),
  ],
});
