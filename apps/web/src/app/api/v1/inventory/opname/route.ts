import { NextResponse } from 'next/server';

import { stockOpnameService } from '@/modules/inventory/services/stock-opname.service';
import { createStockOpnameSchema, parseListStockOpnameQuery } from '@/modules/inventory/validators';
import { apiSuccess, apiValidationError } from '@/lib/api-response';
import { withApiRoute } from '@/lib/api/with-api-route';

export const GET = withApiRoute(
  async (request, { user }) => {
    const parsed = parseListStockOpnameQuery(new URL(request.url).searchParams);
    if (!parsed.success) return apiValidationError(parsed.error);

    const result = await stockOpnameService.listOpnames(user.id, parsed.data);
    return apiSuccess(result);
  },
  { requireAuth: true },
);

export const POST = withApiRoute(
  async (request, { user }) => {
    const body: unknown = await request.json().catch(() => ({}));
    const parsed = createStockOpnameSchema.safeParse(body);
    if (!parsed.success) return apiValidationError(parsed.error);

    const opname = await stockOpnameService.createOpname(user.id, parsed.data);
    return apiSuccess(opname, 201);
  },
  { requireAuth: true },
);

export function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
