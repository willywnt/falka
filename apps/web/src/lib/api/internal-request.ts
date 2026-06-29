import 'server-only';

import { timingSafeEqual } from 'crypto';

import { getServerEnv } from '@palka/config/env.server';
import { INTERNAL_RATE_LIMIT_PER_MINUTE } from '@palka/config/limits';
import { buildIpRateLimitKey, checkRateLimit } from '@palka/rate-limit';
import { NextResponse } from 'next/server';

import { getRequestIp } from '@/lib/api/request-context';

/**
 * Secret guarding the loopback-only internal endpoints (scheduled order pull, monthly finance
 * auto-gen) that server.ts triggers. Prefers a dedicated INTERNAL_API_SECRET so a leak there can't
 * also unlock sessions; falls back to AUTH_SECRET so a deploy that hasn't set the dedicated secret
 * yet keeps working (server.ts resolves the secret the same way).
 */
function internalSecret(): string {
  const env = getServerEnv();
  return env.INTERNAL_API_SECRET ?? env.AUTH_SECRET;
}

function hasValidSecret(request: Request): boolean {
  const expected = `Bearer ${internalSecret()}`;
  const provided = request.headers.get('authorization') ?? '';
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Guard for the internal, secret-gated endpoints. Rate-limits ONLY proxied (external) callers per
 * caller IP, FIRST, to cap a flood / secret-guessing source reaching the app through the proxy.
 * The legit caller is server.ts on loopback: the TLS proxy (Traefik) always sets a forwarding
 * header, so a request carrying NONE arrived directly in-process — that's our own timer (or someone
 * already inside the box), exempt from the limiter. This stops an external caller spoofing
 * `X-Forwarded-For: unknown` from sharing the loopback caller's bucket and 429-starving the cron.
 * The bearer secret is then verified in constant time for every caller. Returns a Response to
 * short-circuit, or null when the request may proceed.
 */
export async function guardInternalRequest(request: Request): Promise<NextResponse | null> {
  const isProxied = request.headers.has('x-forwarded-for') || request.headers.has('x-real-ip');
  if (isProxied) {
    const rateLimit = await checkRateLimit({
      key: buildIpRateLimitKey('internal', getRequestIp(request)),
      limit: INTERNAL_RATE_LIMIT_PER_MINUTE,
      windowSeconds: 60,
    });
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
    }
  }

  if (!hasValidSecret(request)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  return null;
}
