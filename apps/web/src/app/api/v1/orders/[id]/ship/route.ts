import { NextResponse } from 'next/server';
import { z } from 'zod';

import { ordersServerService } from '@/modules/orders/services/orders-server.service';
import { markShippedSchema } from '@/modules/orders/validators/order-actions';
import { apiNotFound, apiSuccess, apiValidationError } from '@/lib/api-response';
import { withApiRoute } from '@/lib/api/with-api-route';

const orderIdParamSchema = z.object({ id: z.string().cuid() });

type RouteParams = { id: string };

export const POST = withApiRoute<RouteParams>(
  async (request, { user, params }) => {
    const parsedParams = orderIdParamSchema.safeParse(await params);
    if (!parsedParams.success) return apiNotFound('Order not found');

    const body: unknown = await request.json().catch(() => ({}));
    const parsed = markShippedSchema.safeParse(body);
    if (!parsed.success) return apiValidationError(parsed.error);

    const result = await ordersServerService.markOrderShipped(
      user.id,
      parsedParams.data.id,
      parsed.data,
    );
    return apiSuccess(result);
  },
  { requireAuth: true },
);

export function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
