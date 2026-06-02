import { NextResponse } from 'next/server';
import { z } from 'zod';

import { recordingServerService } from '@/modules/recordings/services/recording-server.service';
import { apiSuccess, apiValidationError } from '@/lib/api-response';
import { withApiRoute } from '@/lib/api/with-api-route';

const duplicateQuerySchema = z.object({
  noResi: z.string().trim().min(1).max(64),
});

export const GET = withApiRoute(
  async (request, { user }) => {
    const parsed = duplicateQuerySchema.safeParse({
      noResi: new URL(request.url).searchParams.get('noResi') ?? '',
    });

    if (!parsed.success) return apiValidationError(parsed.error);

    const duplicate = await recordingServerService.findRecentDuplicateResi(
      user.id,
      parsed.data.noResi,
    );

    return apiSuccess(duplicate);
  },
  { requireAuth: true },
);

export function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
