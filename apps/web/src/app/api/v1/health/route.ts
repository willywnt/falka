import { getPlatformHealthSnapshot } from '@olshop/health';

import { apiSuccess } from '@/lib/api-response';

export async function GET() {
  const health = await getPlatformHealthSnapshot();

  return apiSuccess(health, health.status === 'error' ? 503 : 200);
}
