import { NextResponse } from 'next/server';

import { purchasingServerService } from '@/modules/purchasing/services/purchasing-server.service';
import { createPurchaseOrderSchema } from '@/modules/purchasing/validators/create-po';
import { apiSuccess, apiValidationError } from '@/lib/api-response';
import { withApiRoute } from '@/lib/api/with-api-route';

export const GET = withApiRoute(
  async (_request, { user }) => {
    const orders = await purchasingServerService.listPurchaseOrders(user.id);
    return apiSuccess(orders);
  },
  { requireAuth: true },
);

export const POST = withApiRoute(
  async (request, { user }) => {
    const body: unknown = await request.json().catch(() => ({}));
    const parsed = createPurchaseOrderSchema.safeParse(body);
    if (!parsed.success) return apiValidationError(parsed.error);

    const order = await purchasingServerService.createPurchaseOrder(user.id, parsed.data);
    return apiSuccess(order, 201);
  },
  { requireAuth: true },
);

export function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
