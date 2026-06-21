import { NextResponse } from 'next/server';

import { authService } from '@/modules/auth/services/auth.service';
import { changePasswordSchema } from '@/modules/auth/validators/change-password';
import { apiSuccess, apiValidationError } from '@/lib/api-response';
import { withApiRoute } from '@/lib/api/with-api-route';

export const POST = withApiRoute(
  async (request, { user }) => {
    const body: unknown = await request.json().catch(() => ({}));
    const parsed = changePasswordSchema.safeParse(body);
    if (!parsed.success) return apiValidationError(parsed.error);

    await authService.changePassword(user.id, parsed.data.currentPassword, parsed.data.newPassword);
    return apiSuccess(null);
  },
  { requireAuth: true, rateLimit: 'write' },
);

export function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
