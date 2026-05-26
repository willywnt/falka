import { NextResponse } from 'next/server';
import type { ApiError } from '@olshop/types';
import { ZodError } from 'zod';

import { StorageError } from '@/modules/storage/errors/storage-errors';
import { RecordingError } from '@/modules/recordings/errors/recording-errors';
import { MarketplaceError } from '@/modules/marketplace/errors/marketplace-errors';
import { AppError } from '@/lib/errors';
import { appLogger } from '@/lib/logger';

export function apiSuccess<T>(data: T, status = 200, meta?: Record<string, unknown>) {
  return NextResponse.json({ data, ...(meta ? { meta } : {}) }, { status });
}

export function apiError(error: ApiError, status = 400) {
  return NextResponse.json({ error }, { status });
}

export function apiNotFound(message = 'Resource not found') {
  return apiError({ code: 'NOT_FOUND', message }, 404);
}

export function apiUnauthorized(message = 'Unauthorized') {
  return apiError({ code: 'UNAUTHORIZED', message }, 401);
}

export function apiForbidden(message = 'Forbidden') {
  return apiError({ code: 'FORBIDDEN', message }, 403);
}

export function apiValidationError(error: ZodError) {
  return apiError(
    {
      code: 'VALIDATION_ERROR',
      message: 'Validation failed',
      details: error.flatten().fieldErrors as Record<string, unknown>,
    },
    400,
  );
}

export function apiInternalError(message = 'Internal server error') {
  return apiError({ code: 'INTERNAL_ERROR', message }, 500);
}

export function handleApiError(error: unknown) {
  appLogger.error('API route error', { error: String(error) });

  if (error instanceof ZodError) return apiValidationError(error);
  if (error instanceof StorageError) {
    return apiError({ code: error.code, message: error.message }, error.statusCode);
  }
  if (error instanceof RecordingError) {
    const status = error.code === 'ACTIVE_RECORDING_EXISTS' ? 409 : 400;
    return apiError({ code: error.code, message: error.message }, status);
  }
  if (error instanceof MarketplaceError) {
    return apiError({ code: error.code, message: error.message }, error.statusCode);
  }
  if (error instanceof AppError) {
    return apiError({ code: error.code, message: error.message, details: error.details }, error.statusCode);
  }

  return apiInternalError();
}
