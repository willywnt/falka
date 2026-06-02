import { NextResponse } from 'next/server';

import { pairingService } from '@/modules/scanner-pairing/services/pairing.service';
import { pairingIdSchema } from '@/modules/scanner-pairing/validators/pairing';
import { apiSuccess, apiValidationError } from '@/lib/api-response';
import { withApiRoute } from '@/lib/api/with-api-route';

type RouteParams = { id: string };

export const GET = withApiRoute<RouteParams>(
  async (_request, { user, params }) => {
    const { id } = await params;
    const parsed = pairingIdSchema.safeParse(id);
    if (!parsed.success) return apiValidationError(parsed.error);

    const session = await pairingService.getSessionForUser(user.id, parsed.data);
    return apiSuccess({ session });
  },
  { requireAuth: true },
);

export const DELETE = withApiRoute<RouteParams>(
  async (_request, { user, params }) => {
    const { id } = await params;
    const parsed = pairingIdSchema.safeParse(id);
    if (!parsed.success) return apiValidationError(parsed.error);

    const session = await pairingService.disconnect(user.id, parsed.data);
    return apiSuccess({ session });
  },
  { requireAuth: true },
);

export function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
