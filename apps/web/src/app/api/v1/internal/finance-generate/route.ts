import { timingSafeEqual } from 'crypto';

import { getServerEnv } from '@palka/config/env.server';
import { NextResponse } from 'next/server';

import { appLogger } from '@/lib/logger';
import { financeAutogenService } from '@/modules/finance/services/finance-autogen.service';

/**
 * Internal, secret-gated trigger for the monthly finance auto-generation. Called by the custom
 * server's timer (server.ts) on a loopback request — runs INSIDE Next so the finance module graph
 * resolves (the bootstrap can't import the server-only services directly). NOT a user endpoint: it
 * carries no session and writes for EVERY org, so it requires the AUTH_SECRET bearer. The work is
 * idempotent, so a manual re-trigger is safe.
 */
function isAuthorized(request: Request): boolean {
  const expected = `Bearer ${getServerEnv().AUTH_SECRET}`;
  const provided = request.headers.get('authorization') ?? '';
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const result = await financeAutogenService.runMonthlyForAllOrgs(new Date());
    return NextResponse.json({ data: result });
  } catch (error) {
    appLogger.warn('finance.autogen.failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
}
