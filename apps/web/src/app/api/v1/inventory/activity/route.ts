import { NextResponse } from 'next/server';

import { inventoryActivityService } from '@/modules/inventory/services/inventory-activity.service';
import { parseStockActivityQuery } from '@/modules/inventory/validators';
import { apiSuccess, apiValidationError } from '@/lib/api-response';
import { withApiRoute } from '@/lib/api/with-api-route';

export const GET = withApiRoute(
  async (request, { org }) => {
    const parsed = parseStockActivityQuery(new URL(request.url).searchParams);
    if (!parsed.success) return apiValidationError(parsed.error);

    const result = await inventoryActivityService.listStockActivity(org.id, parsed.data);
    return apiSuccess(result.items, 200, { ...result.meta });
  },
  { requireAuth: true },
);

export function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
