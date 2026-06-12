import { NextResponse } from 'next/server';

import { ordersServerService } from '@/modules/orders/services/orders-server.service';
import { pullOrdersBodySchema } from '@/modules/orders/validators/pull-orders';
import { apiSuccess, apiValidationError } from '@/lib/api-response';
import { withApiRoute } from '@/lib/api/with-api-route';

export const POST = withApiRoute(
  async (request, { user, org }) => {
    const body: unknown = await request.json().catch(() => ({}));
    const parsed = pullOrdersBodySchema.safeParse(body);
    if (!parsed.success) return apiValidationError(parsed.error);

    const result = await ordersServerService.pullFromConnections(
      org.id,
      user.id,
      parsed.data.connectionIds,
    );
    return apiSuccess(result);
  },
  { requireAuth: true },
);

export function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
