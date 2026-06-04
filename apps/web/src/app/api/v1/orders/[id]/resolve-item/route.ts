import { NextResponse } from 'next/server';
import { z } from 'zod';

import { ordersServerService } from '@/modules/orders/services/orders-server.service';
import { resolveOrderItemSchema } from '@/modules/orders/validators/resolve-order-item';
import { apiNotFound, apiSuccess, apiValidationError } from '@/lib/api-response';
import { withApiRoute } from '@/lib/api/with-api-route';

const orderIdParamSchema = z.object({ id: z.string().cuid() });

type RouteParams = { id: string };

export const POST = withApiRoute<RouteParams>(
  async (request, { user, params }) => {
    const parsedParams = orderIdParamSchema.safeParse(await params);
    if (!parsedParams.success) return apiNotFound('Order not found');

    const body: unknown = await request.json();
    const parsed = resolveOrderItemSchema.safeParse(body);
    if (!parsed.success) return apiValidationError(parsed.error);

    const result = await ordersServerService.resolveOrderItem(
      user.id,
      parsedParams.data.id,
      parsed.data.orderItemId,
      parsed.data.variantId,
    );
    return apiSuccess(result);
  },
  { requireAuth: true },
);

export function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
