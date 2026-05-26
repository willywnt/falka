import { NextResponse } from 'next/server';

import { getCurrentUser } from '@/modules/auth/services/session';
import { RecordingError } from '@/modules/recordings/errors/recording-errors';
import { recordingServerService } from '@/modules/recordings/services/recording-server.service';
import { startRecordingSchema } from '@/modules/recordings/validators/create-recording';
import {
  apiError,
  apiSuccess,
  apiUnauthorized,
  apiValidationError,
  handleApiError,
} from '@/lib/api-response';
import { appLogger } from '@/lib/logger';

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiUnauthorized();

    const body: unknown = await request.json();
    const parsed = startRecordingSchema.safeParse(body);

    if (!parsed.success) {
      return apiValidationError(parsed.error);
    }

    const started = await recordingServerService.startRecording(user.id, parsed.data.noResi);

    appLogger.info('recording.started', {
      userId: user.id,
      recordingId: started.recordingId,
      noResi: started.noResi,
    });

    return apiSuccess(started, 201);
  } catch (error) {
    if (error instanceof RecordingError) {
      const status = error.code === 'ACTIVE_RECORDING_EXISTS' ? 409 : 400;
      return apiError({ code: error.code, message: error.message }, status);
    }

    return handleApiError(error);
  }
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
