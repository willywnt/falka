import { NextResponse } from 'next/server';

import { purchasingServerService } from '@/modules/purchasing/services/purchasing-server.service';
import { searchVariantsQuerySchema } from '@/modules/purchasing/validators/search-variants';
import { apiSuccess, apiValidationError } from '@/lib/api-response';
import { withApiRoute } from '@/lib/api/with-api-route';

export const GET = withApiRoute(
  async (request, { user }) => {
    const parsed = searchVariantsQuerySchema.safeParse({
      q: new URL(request.url).searchParams.get('q') ?? '',
    });
    if (!parsed.success) return apiValidationError(parsed.error);

    const variants = await purchasingServerService.searchVariants(user.id, parsed.data.q);
    return apiSuccess(variants);
  },
  { requireAuth: true },
);

export function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
