import { NextResponse } from 'next/server';

import { getCurrentUser } from '@/modules/auth/services/session';
import { PairingError } from '@/modules/scanner-pairing/errors/pairing-errors';
import { pairingService } from '@/modules/scanner-pairing/services/pairing.service';
import { pairingIdSchema } from '@/modules/scanner-pairing/validators/pairing';
import {
  apiError,
  apiSuccess,
  apiUnauthorized,
  apiValidationError,
  handleApiError,
} from '@/lib/api-response';
import { runWithRequestContext } from '@/lib/api/request-context';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  return runWithRequestContext(_request, undefined, async () => {
    try {
      const user = await getCurrentUser();
      if (!user) return apiUnauthorized();

      const { id } = await context.params;
      const parsed = pairingIdSchema.safeParse(id);
      if (!parsed.success) return apiValidationError(parsed.error);

      const session = await pairingService.getSessionForUser(user.id, parsed.data);
      return apiSuccess({ session });
    } catch (error) {
      if (error instanceof PairingError) {
        return apiError({ code: error.code, message: error.message }, error.statusCode);
      }
      return handleApiError(error);
    }
  });
}

export async function DELETE(_request: Request, context: RouteContext) {
  return runWithRequestContext(_request, undefined, async () => {
    try {
      const user = await getCurrentUser();
      if (!user) return apiUnauthorized();

      const { id } = await context.params;
      const parsed = pairingIdSchema.safeParse(id);
      if (!parsed.success) return apiValidationError(parsed.error);

      const session = await pairingService.disconnect(user.id, parsed.data);
      return apiSuccess({ session });
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
