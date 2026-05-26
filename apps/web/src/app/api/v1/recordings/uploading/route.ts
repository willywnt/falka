import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getCurrentUser } from '@/modules/auth/services/session';
import { recordingServerService } from '@/modules/recordings/services/recording-server.service';
import {
  apiSuccess,
  apiUnauthorized,
  apiValidationError,
  handleApiError,
} from '@/lib/api-response';

const uploadingSchema = z.object({
  recordingId: z.string().cuid(),
});

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiUnauthorized();

    const body: unknown = await request.json();
    const parsed = uploadingSchema.safeParse(body);

    if (!parsed.success) {
      return apiValidationError(parsed.error);
    }

    await recordingServerService.markUploading(parsed.data.recordingId, user.id);

    return apiSuccess({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
