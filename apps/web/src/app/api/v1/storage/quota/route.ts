import { NextResponse } from 'next/server';

import { quotaService } from '@/modules/storage/services/quota.service';
import { apiSuccess } from '@/lib/api-response';
import { withApiRoute } from '@/lib/api/with-api-route';

export const GET = withApiRoute(
  async (_request, { org }) => {
    const snapshot = await quotaService.getQuotaSnapshot(org.id);

    return apiSuccess({
      usedBytes: Number(snapshot.usedBytes),
      quotaBytes: Number(snapshot.quotaBytes),
      remainingBytes: Number(snapshot.remainingBytes),
      usagePercent: snapshot.usagePercent,
    });
  },
  { requireAuth: true },
);

export function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
