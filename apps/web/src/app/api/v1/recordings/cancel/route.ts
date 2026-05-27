import { NextResponse } from 'next/server';

import { getCurrentUser } from '@/modules/auth/services/session';
import { recordingServerService } from '@/modules/recordings/services/recording-server.service';
import { cancelRecordingSchema } from '@/modules/recordings/validators/cancel-recording';
import {
  apiSuccess,
  apiUnauthorized,
  apiValidationError,
  handleApiError,
} from '@/lib/api-response';

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiUnauthorized();

    const body: unknown = await request.json();
    const parsed = cancelRecordingSchema.safeParse(body);

    if (!parsed.success) {
      return apiValidationError(parsed.error);
    }

    await recordingServerService.markFailed(parsed.data.recordingId, user.id, {
      failureCode: parsed.data.failureCode,
      failureReason: parsed.data.failureReason,
    });

    return apiSuccess({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
