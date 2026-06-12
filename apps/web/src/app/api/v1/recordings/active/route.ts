import { NextResponse } from 'next/server';

import { recordingServerService } from '@/modules/recordings/services/recording-server.service';
import { apiSuccess } from '@/lib/api-response';
import { withApiRoute } from '@/lib/api/with-api-route';

export const GET = withApiRoute(
  async (_request, { org }) => {
    const active = await recordingServerService.findActiveRecording(org.id);

    if (!active) {
      return apiSuccess(null);
    }

    return apiSuccess({
      id: active.id,
      noResi: active.noResi,
      startedAt: active.startedAt.toISOString(),
    });
  },
  { requireAuth: true },
);

export function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
