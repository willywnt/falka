import { NextResponse } from 'next/server';

import { getCurrentUser } from '@/modules/auth/services/session';
import { quotaService } from '@/modules/storage/services/quota.service';
import { apiSuccess, apiUnauthorized, handleApiError } from '@/lib/api-response';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return apiUnauthorized();

    const snapshot = await quotaService.getQuotaSnapshot(user.id);

    return apiSuccess({
      usedBytes: Number(snapshot.usedBytes),
      quotaBytes: Number(snapshot.quotaBytes),
      remainingBytes: Number(snapshot.remainingBytes),
      usagePercent: snapshot.usagePercent,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
