import { NextResponse } from 'next/server';

import { purchasingServerService } from '@/modules/purchasing/services/purchasing-server.service';
import { receivePurchaseOrderSchema } from '@/modules/purchasing/validators/receive-po';
import { purchaseOrderIdSchema } from '@/modules/purchasing/validators/po-id';
import { apiNotFound, apiSuccess, apiValidationError } from '@/lib/api-response';
import { withApiRoute } from '@/lib/api/with-api-route';

type RouteParams = { id: string };

export const POST = withApiRoute<RouteParams>(
  async (request, { user, org, params }) => {
    const parsedParams = purchaseOrderIdSchema.safeParse(await params);
    if (!parsedParams.success) return apiNotFound('Purchase order not found');

    const body: unknown = await request.json().catch(() => ({}));
    const parsed = receivePurchaseOrderSchema.safeParse(body);
    if (!parsed.success) return apiValidationError(parsed.error);

    const order = await purchasingServerService.receivePurchaseOrder(
      org.id,
      user.id,
      parsedParams.data.id,
      parsed.data,
    );
    return apiSuccess(order);
  },
  { requireAuth: true },
);

export function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
