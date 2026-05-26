import { healthCheckDb } from '@olshop/db';
import { apiSuccess } from '@/lib/api-response';

export async function GET() {
  const dbHealthy = await healthCheckDb();

  return apiSuccess({
    status: dbHealthy ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    services: {
      database: dbHealthy ? 'ok' : 'unavailable',
    },
  });
}
