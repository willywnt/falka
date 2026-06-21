import { NextResponse } from 'next/server';

import { authService } from '@/modules/auth/services/auth.service';
import { apiSuccess } from '@/lib/api-response';
import { withApiRoute } from '@/lib/api/with-api-route';

export const GET = withApiRoute(
  async (_request, { user }) => {
    const info = await authService.getSecurityInfo(user.id);
    return apiSuccess(info);
  },
  { requireAuth: true },
);

export function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
