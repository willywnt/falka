import { NextResponse } from 'next/server';

import { stockOpnameService } from '@/modules/inventory/services/stock-opname.service';
import { parseSearchCountableVariantsQuery } from '@/modules/inventory/validators';
import { apiSuccess, apiValidationError } from '@/lib/api-response';
import { withApiRoute } from '@/lib/api/with-api-route';

export const GET = withApiRoute(
  async (request, { org }) => {
    const parsed = parseSearchCountableVariantsQuery(new URL(request.url).searchParams);
    if (!parsed.success) return apiValidationError(parsed.error);

    const result = await stockOpnameService.searchCountableVariants(org.id, parsed.data);
    return apiSuccess(result);
  },
  { requireAuth: true },
);

export function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
