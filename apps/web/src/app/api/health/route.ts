import { getPlatformHealthSnapshot } from '@falka/health';
import { NextResponse } from 'next/server';

export async function GET() {
  const health = await getPlatformHealthSnapshot();
  const statusCode = health.status === 'error' ? 503 : 200;

  return NextResponse.json(health, { status: statusCode });
}
