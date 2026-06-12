import { NextResponse } from 'next/server';

import { stockOpnameService } from '@/modules/inventory/services/stock-opname.service';
import { stockOpnameIdSchema, upsertOpnameItemSchema } from '@/modules/inventory/validators';
import { apiNotFound, apiSuccess, apiValidationError } from '@/lib/api-response';
import { withApiRoute } from '@/lib/api/with-api-route';

type RouteParams = { id: string };

export const POST = withApiRoute<RouteParams>(
  async (request, { org, params }) => {
    const parsedParams = stockOpnameIdSchema.safeParse(await params);
    if (!parsedParams.success) return apiNotFound('Stock opname not found');

    const body: unknown = await request.json().catch(() => ({}));
    const parsed = upsertOpnameItemSchema.safeParse(body);
    if (!parsed.success) return apiValidationError(parsed.error);

    const opname = await stockOpnameService.upsertItem(org.id, parsedParams.data.id, parsed.data);
    return apiSuccess(opname);
  },
  { requireAuth: true },
);

export function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
