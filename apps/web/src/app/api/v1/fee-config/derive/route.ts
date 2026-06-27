import { NextResponse } from 'next/server';

import { apiSuccess, apiValidationError } from '@/lib/api-response';
import { withApiRoute } from '@/lib/api/with-api-route';
import { feeServerService } from '@/modules/finance/services/fee-server.service';
import { deriveFeesSchema } from '@/modules/finance/validators/fee-config';

export const POST = withApiRoute(
  async (request, { user, org }) => {
    const body: unknown = await request.json().catch(() => ({}));
    const parsed = deriveFeesSchema.safeParse(body);
    if (!parsed.success) return apiValidationError(parsed.error);

    const result = await feeServerService.deriveFeesForMonth(org.id, user.id, parsed.data.month);
    return apiSuccess(result);
  },
  { requireAuth: true, requirePermission: 'finance.manage' },
);

export function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
