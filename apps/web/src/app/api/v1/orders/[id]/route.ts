import { NextResponse } from 'next/server';

import { ordersServerService } from '@/modules/orders/services/orders-server.service';
import { orderIdParamSchema } from '@/modules/orders/validators/order-id';
import { apiNotFound, apiSuccess } from '@/lib/api-response';
import { withApiRoute } from '@/lib/api/with-api-route';

type RouteParams = { id: string };

export const GET = withApiRoute<RouteParams>(
  async (_request, { user, params }) => {
    const parsed = orderIdParamSchema.safeParse(await params);
    if (!parsed.success) return apiNotFound('Order not found');

    const order = await ordersServerService.getOrder(user.id, parsed.data.id);
    return apiSuccess(order);
  },
  { requireAuth: true },
);

export function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
