import { NextResponse } from 'next/server';

import { getCurrentUser } from '@/modules/auth/services/session';
import { PairingError } from '@/modules/scanner-pairing/errors/pairing-errors';
import { pairingService } from '@/modules/scanner-pairing/services/pairing.service';
import { apiError, apiSuccess, apiUnauthorized, handleApiError } from '@/lib/api-response';
import { runWithRequestContext } from '@/lib/api/request-context';

export async function POST(request: Request) {
  return runWithRequestContext(request, undefined, async () => {
    try {
      const user = await getCurrentUser();
      if (!user) return apiUnauthorized();

      const created = await pairingService.createSession(user.id);

      return apiSuccess(created, 201);
    } catch (error) {
      if (error instanceof PairingError) {
        return apiError({ code: error.code, message: error.message }, error.statusCode);
      }
      return handleApiError(error);
    }
  });
}

export async function GET(request: Request) {
  return runWithRequestContext(request, undefined, async () => {
    try {
      const user = await getCurrentUser();
      if (!user) return apiUnauthorized();

      const active = await pairingService.getActiveSession(user.id);
      return apiSuccess(active);
    } catch (error) {
      if (error instanceof PairingError) {
        return apiError({ code: error.code, message: error.message }, error.statusCode);
      }
      return handleApiError(error);
    }
  });
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
