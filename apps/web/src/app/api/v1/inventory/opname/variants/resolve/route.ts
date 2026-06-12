import { NextResponse } from 'next/server';

import { stockOpnameService } from '@/modules/inventory/services/stock-opname.service';
import { resolveCountableCodeSchema } from '@/modules/inventory/validators';
import { apiSuccess, apiValidationError } from '@/lib/api-response';
import { withApiRoute } from '@/lib/api/with-api-route';

export const GET = withApiRoute(
  async (request, { org }) => {
    const parsed = resolveCountableCodeSchema.safeParse({
      code: new URL(request.url).searchParams.get('code') ?? '',
    });
    if (!parsed.success) return apiValidationError(parsed.error);

    const variant = await stockOpnameService.resolveCountableVariant(org.id, parsed.data.code);
    return apiSuccess(variant);
  },
  { requireAuth: true },
);

export function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
