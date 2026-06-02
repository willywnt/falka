import { NextResponse } from 'next/server';
import { z } from 'zod';

import { recordingServerService } from '@/modules/recordings/services/recording-server.service';
import { apiSuccess, apiValidationError } from '@/lib/api-response';
import { withApiRoute } from '@/lib/api/with-api-route';

const uploadingSchema = z.object({
  recordingId: z.string().cuid(),
});

export const POST = withApiRoute(
  async (request, { user }) => {
    const body: unknown = await request.json();
    const parsed = uploadingSchema.safeParse(body);

    if (!parsed.success) return apiValidationError(parsed.error);

    await recordingServerService.markUploading(parsed.data.recordingId, user.id);

    return apiSuccess({ success: true });
  },
  { requireAuth: true },
);

export function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
