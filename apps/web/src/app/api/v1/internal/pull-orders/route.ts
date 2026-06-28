import { timingSafeEqual } from 'crypto';

import { getServerEnv } from '@palka/config/env.server';
import { NextResponse } from 'next/server';

import { appLogger } from '@/lib/logger';
import { ordersServerService } from '@/modules/orders/services/orders-server.service';

/**
 * Internal, secret-gated trigger for the scheduled order pull. Called by the custom server's
 * timer (server.ts) on a loopback request — runs INSIDE Next so the order-ingest module graph
 * resolves normally (the server bootstrap can't import it directly). NOT a user endpoint: it
 * carries no session and pulls every org's active stores, so it requires the AUTH_SECRET bearer.
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
    const result = await ordersServerService.runScheduledPull();
    return NextResponse.json({ data: result });
  } catch (error) {
    appLogger.warn('orders.internal_pull.failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
}
