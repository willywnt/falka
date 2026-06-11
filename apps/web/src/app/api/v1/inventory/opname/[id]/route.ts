import { NextResponse } from 'next/server';

import { stockOpnameService } from '@/modules/inventory/services/stock-opname.service';
import { stockOpnameIdSchema } from '@/modules/inventory/validators';
import { apiNotFound, apiSuccess } from '@/lib/api-response';
import { withApiRoute } from '@/lib/api/with-api-route';

type RouteParams = { id: string };

export const GET = withApiRoute<RouteParams>(
  async (_request, { user, params }) => {
    const parsedParams = stockOpnameIdSchema.safeParse(await params);
    if (!parsedParams.success) return apiNotFound('Stock opname not found');

    const opname = await stockOpnameService.getOpname(user.id, parsedParams.data.id);
    return apiSuccess(opname);
  },
  { requireAuth: true },
);

export function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
