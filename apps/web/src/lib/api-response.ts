import 'server-only';

import { getRequestId, logger } from '@olshop/logger/server';
import { sanitizeError } from '@olshop/logger/sanitize';
import type { ApiError } from '@olshop/types';
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

import { AppError } from '@/lib/errors';
import { StorageError } from '@/modules/storage/errors/storage-errors';
import { RecordingError } from '@/modules/recordings/errors/recording-errors';
import { MarketplaceError } from '@/modules/marketplace/errors/marketplace-errors';
import { ReliabilityError } from '@/modules/recording-recovery/errors/reliability-errors';

import { REQUEST_ID_HEADER } from '@olshop/logger';

function attachRequestId(response: NextResponse, requestId?: string): NextResponse {
  if (requestId) {
    response.headers.set(REQUEST_ID_HEADER, requestId);
  }

  return response;
}

export function apiSuccess<T>(
  data: T,
  status = 200,
  meta?: Record<string, unknown>,
  requestId?: string,
) {
  return attachRequestId(
    NextResponse.json({ data, ...(meta ? { meta } : {}) }, { status }),
    requestId,
  );
}

export function apiError(error: ApiError, status = 400, requestId?: string) {
  return attachRequestId(NextResponse.json({ error }, { status }), requestId);
}

export function apiNotFound(message = 'Resource not found', requestId?: string) {
  return apiError({ code: 'NOT_FOUND', message }, 404, requestId);
}

export function apiUnauthorized(message = 'Unauthorized', requestId?: string) {
  return apiError({ code: 'UNAUTHORIZED', message }, 401, requestId);
}

export function apiForbidden(message = 'Forbidden', requestId?: string) {
  return apiError({ code: 'FORBIDDEN', message }, 403, requestId);
}

export function apiValidationError(error: ZodError, requestId?: string) {
  return apiError(
    {
      code: 'VALIDATION_ERROR',
      message: 'Validation failed',
      details: error.flatten().fieldErrors as Record<string, unknown>,
    },
    400,
    requestId,
  );
}

export function apiInternalError(message = 'Internal server error', requestId?: string) {
  return apiError({ code: 'INTERNAL_ERROR', message }, 500, requestId);
}

export function handleApiError(error: unknown, requestId = getRequestId()) {
  const sanitized = sanitizeError(error);

  logger.error('api.failure', {
    requestId,
    error: sanitized.message,
    name: sanitized.name,
  });

  if (error instanceof ZodError) return apiValidationError(error, requestId);
  if (error instanceof StorageError) {
    return apiError({ code: error.code, message: error.message }, error.statusCode, requestId);
  }
  if (error instanceof RecordingError) {
    const status = error.code === 'ACTIVE_RECORDING_EXISTS' ? 409 : 400;
    return apiError({ code: error.code, message: error.message }, status, requestId);
  }
  if (error instanceof ReliabilityError) {
    return apiError({ code: error.code, message: error.message }, 400, requestId);
  }
  if (error instanceof MarketplaceError) {
    return apiError({ code: error.code, message: error.message }, error.statusCode, requestId);
  }
  if (error instanceof AppError) {
    return apiError(
      { code: error.code, message: error.message, details: error.details },
      error.statusCode,
      requestId,
    );
  }

  return apiInternalError(undefined, requestId);
}
