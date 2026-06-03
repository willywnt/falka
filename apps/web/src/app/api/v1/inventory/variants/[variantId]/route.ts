import { NextResponse } from 'next/server';

import { inventoryServerService } from '@/modules/inventory/services/inventory-server.service';
import { variantIdParamSchema } from '@/modules/inventory/validators';
import { apiNotFound, apiSuccess } from '@/lib/api-response';
import { withApiRoute } from '@/lib/api/with-api-route';

type RouteParams = { variantId: string };

export const GET = withApiRoute<RouteParams>(
  async (_request, { user, params }) => {
    const parsed = variantIdParamSchema.safeParse(await params);
    if (!parsed.success) return apiNotFound('Product variant not found');

    const view = await inventoryServerService.getView(user.id, parsed.data.variantId);
    return apiSuccess(view);
  },
  { requireAuth: true },
);

export function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
