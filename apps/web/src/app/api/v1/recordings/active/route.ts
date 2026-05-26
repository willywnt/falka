import { NextResponse } from 'next/server';

import { getCurrentUser } from '@/modules/auth/services/session';
import { recordingServerService } from '@/modules/recordings/services/recording-server.service';
import { apiSuccess, apiUnauthorized, handleApiError } from '@/lib/api-response';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return apiUnauthorized();

    const active = await recordingServerService.findActiveRecording(user.id);

    if (!active) {
      return apiSuccess(null);
    }

    return apiSuccess({
      id: active.id,
      noResi: active.noResi,
      startedAt: active.startedAt.toISOString(),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
