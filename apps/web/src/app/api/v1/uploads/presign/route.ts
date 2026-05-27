import { NextResponse } from 'next/server';

import { METRIC_KEYS, incrementMetric } from '@olshop/metrics';
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
import { assertRateLimitAllowed, enforceRateLimit, rateLimitHeaders } from '@/lib/api/rate-limit';
import { getRequestIp, runWithRequestContext } from '@/lib/api/request-context';
import { appLogger } from '@/lib/logger';

export async function POST(request: Request) {
  return runWithRequestContext(request, undefined, async () => {
    try {
      const user = await getCurrentUser();

      if (!user) {
        return apiUnauthorized('You must be signed in to upload files.');
      }

      const ip = getRequestIp(request);
      const rateLimitResult = await enforceRateLimit('upload', { ip, userId: user.id });
      assertRateLimitAllowed(rateLimitResult);

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
      await incrementMetric(METRIC_KEYS.UPLOADS_TOTAL, 1);
      appLogger.info('storage.upload.presign.created', {
        userId: user.id,
        storageKey: result.storageKey,
      });

      const response = apiSuccess({
        uploadUrl: result.uploadUrl,
        storageKey: result.storageKey,
        publicUrl: result.publicUrl,
        expiresAt: result.expiresAt,
      });

      for (const [key, value] of Object.entries(rateLimitHeaders(rateLimitResult))) {
        response.headers.set(key, value);
      }

      return response;
    } catch (error) {
      await incrementMetric(METRIC_KEYS.UPLOADS_FAILED, 1);

      if (error instanceof StorageError) {
        appLogger.warn('storage.upload.presign.failed', {
          code: error.code,
          message: error.message,
        });

        return apiError({ code: error.code, message: error.message }, error.statusCode);
      }

      return handleApiError(error);
    }
  });
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
