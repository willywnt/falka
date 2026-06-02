import { NextResponse } from 'next/server';

import { RecordingError } from '@/modules/recordings/errors/recording-errors';
import { recordingServerService } from '@/modules/recordings/services/recording-server.service';
import { recordingIdParamSchema } from '@/modules/recordings/validators/list-recordings';
import { apiNotFound, apiSuccess } from '@/lib/api-response';
import { withApiRoute } from '@/lib/api/with-api-route';

type RouteParams = { id: string };

export const GET = withApiRoute<RouteParams>(
  async (_request, { user, params }) => {
    const parsed = recordingIdParamSchema.safeParse(await params);
    if (!parsed.success) return apiNotFound('Recording not found');

    try {
      const download = await recordingServerService.getDownloadInfo(user.id, parsed.data.id);
      return apiSuccess(download);
    } catch (error) {
      if (error instanceof RecordingError) return apiNotFound(error.message);
      throw error;
    }
  },
  { requireAuth: true },
);

export function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
