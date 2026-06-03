import { NextResponse } from 'next/server';

import { ordersServerService } from '@/modules/orders/services/orders-server.service';
import { apiSuccess } from '@/lib/api-response';
import { withApiRoute } from '@/lib/api/with-api-route';

export const GET = withApiRoute(
  async (_request, { user }) => {
    const orders = await ordersServerService.listOrders(user.id);
    return apiSuccess(orders);
  },
  { requireAuth: true },
);

export function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
