import 'server-only';

import { getRequestId, logger } from '@palka/logger/server';
import { sanitizeError } from '@palka/logger/sanitize';
import type { ApiError } from '@palka/types';
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

import { DomainError } from '@/lib/errors';

import { REQUEST_ID_HEADER } from '@palka/logger';

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

  // Every feature-module error (RecordingError, PairingError, …) extends
  // DomainError, so the shared layer maps them generically from code +
  // statusCode without importing any module. Module errors carry no `details`,
  // so the key is dropped from the JSON for them — identical to before.
  if (error instanceof DomainError) {
    return apiError(
      { code: error.code, message: error.message, details: error.details },
      error.statusCode,
      requestId,
    );
  }

  return apiInternalError(undefined, requestId);
}
