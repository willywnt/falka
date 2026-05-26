import { NextResponse } from 'next/server';

import { getCurrentUser } from '@/modules/auth/services/session';
import { StorageError } from '@/modules/storage/errors/storage-errors';
import { uploadService } from '@/modules/storage/services/upload.service';
import { presignUploadSchema } from '@/modules/storage/validators/presign';
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

    if (!user) {
      return apiUnauthorized('You must be signed in to upload files.');
    }

    const body: unknown = await request.json();
    const parsed = presignUploadSchema.safeParse(body);

    if (!parsed.success) {
      appLogger.warn('storage.upload.presign.validation_failed', {
        userId: user.id,
        issues: parsed.error.flatten().fieldErrors,
      });
      return apiValidationError(parsed.error);
    }

    const result = await uploadService.createPresignedUpload(user.id, parsed.data);

    return apiSuccess({
      uploadUrl: result.uploadUrl,
      storageKey: result.storageKey,
      publicUrl: result.publicUrl,
      expiresAt: result.expiresAt,
    });
  } catch (error) {
    if (error instanceof StorageError) {
      appLogger.warn('storage.upload.presign.failed', {
        code: error.code,
        message: error.message,
      });

      return apiError({ code: error.code, message: error.message }, error.statusCode);
    }

    return handleApiError(error);
  }
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
