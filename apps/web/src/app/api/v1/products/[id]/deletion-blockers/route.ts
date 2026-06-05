import { NextResponse } from 'next/server';

import { catalogServerService } from '@/modules/catalog/services/catalog-server.service';
import { productIdParamSchema } from '@/modules/catalog/validators';
import { apiNotFound, apiSuccess } from '@/lib/api-response';
import { withApiRoute } from '@/lib/api/with-api-route';

type RouteParams = { id: string };

export const GET = withApiRoute<RouteParams>(
  async (request, { user, params }) => {
    const parsedParams = productIdParamSchema.safeParse(await params);
    if (!parsedParams.success) return apiNotFound('Product not found');

    const raw = new URL(request.url).searchParams.get('variantIds');
    const variantIds = raw ? raw.split(',').filter(Boolean) : undefined;

    const blockers = await catalogServerService.getDeletionBlockers(
      user.id,
      parsedParams.data.id,
      variantIds,
    );
    return apiSuccess(blockers);
  },
  { requireAuth: true },
);

export function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
