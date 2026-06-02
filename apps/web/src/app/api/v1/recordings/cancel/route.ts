import { NextResponse } from 'next/server';

import { recordingServerService } from '@/modules/recordings/services/recording-server.service';
import { cancelRecordingSchema } from '@/modules/recordings/validators/cancel-recording';
import { apiSuccess, apiValidationError } from '@/lib/api-response';
import { withApiRoute } from '@/lib/api/with-api-route';

export const POST = withApiRoute(
  async (request, { user }) => {
    const body: unknown = await request.json();
    const parsed = cancelRecordingSchema.safeParse(body);

    if (!parsed.success) return apiValidationError(parsed.error);

    await recordingServerService.markFailed(parsed.data.recordingId, user.id, {
      failureCode: parsed.data.failureCode,
      failureReason: parsed.data.failureReason,
    });

    return apiSuccess({ success: true });
  },
  { requireAuth: true },
);

export function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
