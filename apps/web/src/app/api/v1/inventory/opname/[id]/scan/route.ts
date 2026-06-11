import { NextResponse } from 'next/server';

import { stockOpnameService } from '@/modules/inventory/services/stock-opname.service';
import { resolveCountableCodeSchema, stockOpnameIdSchema } from '@/modules/inventory/validators';
import { apiNotFound, apiSuccess, apiValidationError } from '@/lib/api-response';
import { withApiRoute } from '@/lib/api/with-api-route';

type RouteParams = { id: string };

export const POST = withApiRoute<RouteParams>(
  async (request, { user, params }) => {
    const parsedParams = stockOpnameIdSchema.safeParse(await params);
    if (!parsedParams.success) return apiNotFound('Stock opname not found');

    const body: unknown = await request.json().catch(() => ({}));
    const parsed = resolveCountableCodeSchema.safeParse(body);
    if (!parsed.success) return apiValidationError(parsed.error);

    const result = await stockOpnameService.scanCountItem(
      user.id,
      parsedParams.data.id,
      parsed.data.code,
    );
    return apiSuccess(result);
  },
  { requireAuth: true },
);

export function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
