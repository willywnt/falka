import { NextResponse } from 'next/server';

import { getCurrentUser } from '@/modules/auth/services/session';
import { RecordingError } from '@/modules/recordings/errors/recording-errors';
import { recordingServerService } from '@/modules/recordings/services/recording-server.service';
import { recordingIdParamSchema } from '@/modules/recordings/validators/list-recordings';
import {
  apiNotFound,
  apiSuccess,
  apiUnauthorized,
  handleApiError,
} from '@/lib/api-response';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiUnauthorized();

    const params = await context.params;
    const parsed = recordingIdParamSchema.safeParse(params);

    if (!parsed.success) {
      return apiNotFound('Recording not found');
    }

    const download = await recordingServerService.getDownloadInfo(user.id, parsed.data.id);
    return apiSuccess(download);
  } catch (error) {
    if (error instanceof RecordingError) {
      return apiNotFound(error.message);
    }

    return handleApiError(error);
  }
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
