import { getPlatformUptimeSeconds, resolveAppVersion } from '@palka/health';
import { NextResponse } from 'next/server';

// Always execute at request time — a health probe must never be statically pre-rendered.
export const dynamic = 'force-dynamic';

/**
 * Liveness probe — answers ONLY "is the web process up and serving HTTP?".
 * Unlike `/api/health` (the readiness snapshot), this intentionally does NOT fan out
 * to R2 / Redis / DB / worker. The container healthcheck polls this every ~30s, and a
 * dependency fan-out here bills a real R2 `ListObjectsV2`/`HeadBucket` per probe
 * (~2,880/day at zero user traffic). Keep this dependency-free so liveness stays cheap;
 * use `/api/health` for on-demand readiness/ops checks.
 */
export function GET() {
  return NextResponse.json({
    status: 'ok',
    uptimeSeconds: getPlatformUptimeSeconds(),
    version: resolveAppVersion(),
    timestamp: new Date().toISOString(),
  });
}
