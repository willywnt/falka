import type { IncomingMessage } from 'http';
import { getToken } from 'next-auth/jwt';
import type { JWT } from 'next-auth/jwt';

import { usesSecureAuthCookies } from '../src/lib/auth-cookies';

type TokenRequestSource = {
  headers: IncomingMessage['headers'] | Headers;
};

/** Resolve JWT from request cookies (tries current + legacy cookie names in HTTPS dev). */
export async function resolveAuthToken(req: TokenRequestSource): Promise<JWT | null> {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    return null;
  }

  const strategies = usesSecureAuthCookies()
    ? [{ secureCookie: true }, { secureCookie: false }]
    : [{ secureCookie: false }];

  for (const strategy of strategies) {
    const token = await getToken({
      req: req as Parameters<typeof getToken>[0]['req'],
      secret,
      secureCookie: strategy.secureCookie,
    });

    if (token && typeof token.id === 'string') {
      return token;
    }
  }

  return null;
}
