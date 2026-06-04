import { NextResponse } from 'next/server';

import { salesServerService } from '@/modules/sales/services/sales-server.service';
import { searchVariantsQuerySchema } from '@/modules/sales/validators/search-variants';
import { apiSuccess, apiValidationError } from '@/lib/api-response';
import { withApiRoute } from '@/lib/api/with-api-route';

export const GET = withApiRoute(
  async (request, { user }) => {
    const parsed = searchVariantsQuerySchema.safeParse({
      q: new URL(request.url).searchParams.get('q') ?? '',
    });
    if (!parsed.success) return apiValidationError(parsed.error);

    const variants = await salesServerService.searchSellableVariants(user.id, parsed.data.q);
    return apiSuccess(variants);
  },
  { requireAuth: true },
);

export function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
