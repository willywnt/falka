import { NextResponse } from 'next/server';

import { purchasingServerService } from '@/modules/purchasing/services/purchasing-server.service';
import { purchaseOrderIdSchema } from '@/modules/purchasing/validators/po-id';
import { updatePurchaseOrderSchema } from '@/modules/purchasing/validators/update-po';
import { apiNotFound, apiSuccess, apiValidationError } from '@/lib/api-response';
import { withApiRoute } from '@/lib/api/with-api-route';

type RouteParams = { id: string };

export const GET = withApiRoute<RouteParams>(
  async (_request, { org, params }) => {
    const parsed = purchaseOrderIdSchema.safeParse(await params);
    if (!parsed.success) return apiNotFound('Purchase order not found');

    const order = await purchasingServerService.getPurchaseOrder(org.id, parsed.data.id);
    return apiSuccess(order);
  },
  { requireAuth: true, requirePermission: 'purchasing.view' },
);

// Edit a DRAFT (supplier/note/lines). Refused once the PO is placed.
export const PATCH = withApiRoute<RouteParams>(
  async (request, { user, org, params }) => {
    const parsedParams = purchaseOrderIdSchema.safeParse(await params);
    if (!parsedParams.success) return apiNotFound('Purchase order not found');

    const body: unknown = await request.json().catch(() => ({}));
    const parsed = updatePurchaseOrderSchema.safeParse(body);
    if (!parsed.success) return apiValidationError(parsed.error);

    const order = await purchasingServerService.updatePurchaseOrder(
      org.id,
      user.id,
      parsedParams.data.id,
      parsed.data,
    );
    return apiSuccess(order);
  },
  { requireAuth: true, rateLimit: 'write', requirePermission: 'purchasing.view' },
);

// Permanently discard a DRAFT (it reserved no stock). A placed PO is cancelled, not deleted.
export const DELETE = withApiRoute<RouteParams>(
  async (_request, { user, org, params }) => {
    const parsed = purchaseOrderIdSchema.safeParse(await params);
    if (!parsed.success) return apiNotFound('Purchase order not found');

    await purchasingServerService.discardDraftPurchaseOrder(org.id, user.id, parsed.data.id);
    return apiSuccess(null);
  },
  { requireAuth: true, rateLimit: 'write', requirePermission: 'purchasing.view' },
);

export function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
