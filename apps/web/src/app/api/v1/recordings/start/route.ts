import { NextResponse } from 'next/server';

import { recordingServerService } from '@/modules/recordings/services/recording-server.service';
import { startRecordingSchema } from '@/modules/recordings/validators/create-recording';
import { apiSuccess, apiValidationError } from '@/lib/api-response';
import { withApiRoute } from '@/lib/api/with-api-route';
import { appLogger } from '@/lib/logger';

export const POST = withApiRoute(
  async (request, { user, org }) => {
    const body: unknown = await request.json();
    const parsed = startRecordingSchema.safeParse(body);

    if (!parsed.success) return apiValidationError(parsed.error);

    const started = await recordingServerService.startRecording(
      org.id,
      user.id,
      parsed.data.noResi,
    );

    appLogger.info('recording.started', {
      userId: user.id,
      organizationId: org.id,
      recordingId: started.recordingId,
      noResi: started.noResi,
    });

    return apiSuccess(started, 201);
  },
  { requireAuth: true, rateLimit: 'recording' },
);

export function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
