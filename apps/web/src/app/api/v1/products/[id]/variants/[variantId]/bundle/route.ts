import { NextResponse } from 'next/server';

import { catalogServerService } from '@/modules/catalog/services/catalog-server.service';
import { setBundleSchema, variantRouteParamSchema } from '@/modules/catalog/validators';
import { apiNotFound, apiSuccess, apiValidationError } from '@/lib/api-response';
import { withApiRoute } from '@/lib/api/with-api-route';

type RouteParams = { id: string; variantId: string };

export const GET = withApiRoute<RouteParams>(
  async (_request, { user, params }) => {
    const parsed = variantRouteParamSchema.safeParse(await params);
    if (!parsed.success) return apiNotFound('Variant not found');

    const bundle = await catalogServerService.getBundle(
      user.id,
      parsed.data.id,
      parsed.data.variantId,
    );
    return apiSuccess(bundle);
  },
  { requireAuth: true },
);

export const PUT = withApiRoute<RouteParams>(
  async (request, { user, params }) => {
    const parsedParams = variantRouteParamSchema.safeParse(await params);
    if (!parsedParams.success) return apiNotFound('Variant not found');

    const body: unknown = await request.json();
    const parsed = setBundleSchema.safeParse(body);
    if (!parsed.success) return apiValidationError(parsed.error);

    const bundle = await catalogServerService.setBundleComponents(
      user.id,
      parsedParams.data.id,
      parsedParams.data.variantId,
      parsed.data,
    );
    return apiSuccess(bundle);
  },
  { requireAuth: true },
);

export function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
