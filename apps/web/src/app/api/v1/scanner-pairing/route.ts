import { NextResponse } from 'next/server';

import { pairingService } from '@/modules/scanner-pairing/services/pairing.service';
import { apiSuccess } from '@/lib/api-response';
import { withApiRoute } from '@/lib/api/with-api-route';

export const POST = withApiRoute(
  async (_request, { user }) => {
    const created = await pairingService.createSession(user.id);
    return apiSuccess(created, 201);
  },
  { requireAuth: true },
);

export const GET = withApiRoute(
  async (_request, { user }) => {
    const active = await pairingService.getActiveSession(user.id);
    return apiSuccess(active);
  },
  { requireAuth: true },
);

export function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
