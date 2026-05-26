import { NextResponse } from 'next/server';

import { getCurrentUser } from '@/modules/auth/services/session';
import { RecordingError } from '@/modules/recordings/errors/recording-errors';
import { recordingServerService } from '@/modules/recordings/services/recording-server.service';
import { saveRecordingMetadataSchema } from '@/modules/recordings/validators/create-recording';
import { listRecordingsQuerySchema } from '@/modules/recordings/validators/list-recordings';
import {
  apiError,
  apiSuccess,
  apiUnauthorized,
  apiValidationError,
  handleApiError,
} from '@/lib/api-response';
import { appLogger } from '@/lib/logger';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiUnauthorized();

    const { searchParams } = new URL(request.url);
    const parsed = listRecordingsQuerySchema.safeParse({
      page: searchParams.get('page') ?? undefined,
      pageSize: searchParams.get('pageSize') ?? undefined,
      search: searchParams.get('search') ?? undefined,
      status: searchParams.get('status') ?? undefined,
      sortBy: searchParams.get('sortBy') ?? undefined,
      sortOrder: searchParams.get('sortOrder') ?? undefined,
    });

    if (!parsed.success) {
      return apiValidationError(parsed.error);
    }

    const result = await recordingServerService.listRecordings(user.id, parsed.data);

    return apiSuccess(result.items, 200, result.meta);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiUnauthorized();

    const body: unknown = await request.json();
    const parsed = saveRecordingMetadataSchema.safeParse(body);

    if (!parsed.success) {
      return apiValidationError(parsed.error);
    }

    if (!parsed.data.storageKey.startsWith(`recordings/${user.id}/`)) {
      return apiError(
        { code: 'VALIDATION_ERROR', message: 'Invalid storage key for this user.' },
        400,
      );
    }

    const saved = await recordingServerService.completeRecording(user.id, parsed.data);

    appLogger.info('recording.metadata.saved', {
      userId: user.id,
      recordingId: saved.id,
      storageKey: saved.storageKey,
      fileSizeBytes: saved.fileSizeBytes,
    });

    return apiSuccess(saved, 201);
  } catch (error) {
    if (error instanceof RecordingError) {
      return apiError({ code: error.code, message: error.message }, 400);
    }

    return handleApiError(error);
  }
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
