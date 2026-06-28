import 'server-only';

import {
  extendCorrelationContext,
  REQUEST_ID_HEADER,
  resolveRequestId,
  runWithRequestId,
} from '@palka/logger/server';

export function getRequestIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0]?.trim() ?? 'unknown';
  }

  return request.headers.get('x-real-ip') ?? 'unknown';
}

export function runWithRequestContext<T>(
  request: Request,
  userId: string | undefined,
  fn: () => T | Promise<T>,
): Promise<T> {
  const requestId = resolveRequestId(request.headers.get(REQUEST_ID_HEADER));

  return Promise.resolve(
    runWithRequestId(requestId, () => {
      if (userId) {
        extendCorrelationContext({ userId });
      }

      return fn();
    }),
  );
}
