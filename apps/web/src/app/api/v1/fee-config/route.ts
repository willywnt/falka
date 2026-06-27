import { NextResponse } from 'next/server';

import { apiSuccess, apiValidationError } from '@/lib/api-response';
import { withApiRoute } from '@/lib/api/with-api-route';
import { feeServerService } from '@/modules/finance/services/fee-server.service';
import { updateFeeConfigSchema } from '@/modules/finance/validators/fee-config';

export const GET = withApiRoute(
  async (_request, { org }) => {
    const config = await feeServerService.getFeeConfig(org.id);
    return apiSuccess(config);
  },
  { requireAuth: true, requirePermission: 'finance.view' },
);

export const PATCH = withApiRoute(
  async (request, { user, org }) => {
    const body: unknown = await request.json().catch(() => ({}));
    const parsed = updateFeeConfigSchema.safeParse(body);
    if (!parsed.success) return apiValidationError(parsed.error);

    const config = await feeServerService.updateFeeConfig(org.id, user.id, parsed.data);
    return apiSuccess(config);
  },
  { requireAuth: true, requirePermission: 'finance.manage' },
);

export function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
