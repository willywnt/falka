import { NextResponse } from 'next/server';

import { RecordingError } from '@/modules/recordings/errors/recording-errors';
import { recordingShareService } from '@/modules/recordings/services/recording-share.service';
import { recordingIdParamSchema } from '@/modules/recordings/validators/list-recordings';
import { createShareLinkSchema } from '@/modules/recordings/validators/share-link';
import type { CreateShareLinkResponse } from '@/modules/recordings/types';
import { apiNotFound, apiSuccess, apiValidationError } from '@/lib/api-response';
import { withApiRoute } from '@/lib/api/with-api-route';

type RouteParams = { id: string };

export const GET = withApiRoute<RouteParams>(
  async (_request, { user, params }) => {
    const parsed = recordingIdParamSchema.safeParse(await params);
    if (!parsed.success) return apiNotFound('Recording not found');

    const links = await recordingShareService.listShareLinks(user.id, parsed.data.id);
    return apiSuccess(links);
  },
  { requireAuth: true },
);

export const POST = withApiRoute<RouteParams>(
  async (request, { user, params }) => {
    const parsedParams = recordingIdParamSchema.safeParse(await params);
    if (!parsedParams.success) return apiNotFound('Recording not found');

    const body = await request.json().catch(() => null);
    const parsedBody = createShareLinkSchema.safeParse(body ?? {});
    if (!parsedBody.success) return apiValidationError(parsedBody.error);

    try {
      const { token, link } = await recordingShareService.createShareLink(
        user.id,
        parsedParams.data.id,
        parsedBody.data.expiresInHours,
      );
      const response: CreateShareLinkResponse = {
        shareUrl: `${new URL(request.url).origin}/share/${token}`,
        link,
      };
      return apiSuccess(response);
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
