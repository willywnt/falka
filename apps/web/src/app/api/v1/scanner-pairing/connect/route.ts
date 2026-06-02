import { NextResponse } from 'next/server';

import { pairingService } from '@/modules/scanner-pairing/services/pairing.service';
import { connectPairingSchema } from '@/modules/scanner-pairing/validators/pairing';
import { apiSuccess, apiValidationError } from '@/lib/api-response';
import { withApiRoute } from '@/lib/api/with-api-route';

export const POST = withApiRoute(
  async (request, { user }) => {
    const body: unknown = await request.json();
    const parsed = connectPairingSchema.safeParse(body);
    if (!parsed.success) return apiValidationError(parsed.error);

    const session = await pairingService.connectMobile(user.id, parsed.data);
    return apiSuccess({ session });
  },
  { requireAuth: true },
);

export function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
