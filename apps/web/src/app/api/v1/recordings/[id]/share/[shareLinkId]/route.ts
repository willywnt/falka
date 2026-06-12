import { NextResponse } from 'next/server';

import { RecordingError } from '@/modules/recordings/errors/recording-errors';
import { recordingShareService } from '@/modules/recordings/services/recording-share.service';
import { shareLinkParamsSchema } from '@/modules/recordings/validators/share-link';
import { apiNotFound, apiSuccess } from '@/lib/api-response';
import { withApiRoute } from '@/lib/api/with-api-route';

type RouteParams = { id: string; shareLinkId: string };

export const DELETE = withApiRoute<RouteParams>(
  async (_request, { org, params }) => {
    const parsed = shareLinkParamsSchema.safeParse(await params);
    if (!parsed.success) return apiNotFound('Share link not found');

    try {
      const link = await recordingShareService.revokeShareLink(org.id, parsed.data.shareLinkId);
      return apiSuccess(link);
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
