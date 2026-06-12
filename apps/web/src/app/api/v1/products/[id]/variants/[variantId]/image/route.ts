import { NextResponse } from 'next/server';

import { catalogServerService } from '@/modules/catalog/services/catalog-server.service';
import { setVariantImageSchema, variantRouteParamSchema } from '@/modules/catalog/validators';
import { apiNotFound, apiSuccess, apiValidationError } from '@/lib/api-response';
import { withApiRoute } from '@/lib/api/with-api-route';

type RouteParams = { id: string; variantId: string };

export const PATCH = withApiRoute<RouteParams>(
  async (request, { org, params }) => {
    const parsedParams = variantRouteParamSchema.safeParse(await params);
    if (!parsedParams.success) return apiNotFound('Variant not found');

    const body: unknown = await request.json();
    const parsed = setVariantImageSchema.safeParse(body);
    if (!parsed.success) return apiValidationError(parsed.error);

    const product = await catalogServerService.setVariantImage(
      org.id,
      parsedParams.data.id,
      parsedParams.data.variantId,
      parsed.data,
    );
    return apiSuccess(product);
  },
  { requireAuth: true },
);

export const DELETE = withApiRoute<RouteParams>(
  async (_request, { org, params }) => {
    const parsedParams = variantRouteParamSchema.safeParse(await params);
    if (!parsedParams.success) return apiNotFound('Variant not found');

    const product = await catalogServerService.removeVariantImage(
      org.id,
      parsedParams.data.id,
      parsedParams.data.variantId,
    );
    return apiSuccess(product);
  },
  { requireAuth: true },
);

export function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
