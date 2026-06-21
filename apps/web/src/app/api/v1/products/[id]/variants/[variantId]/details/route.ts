import { NextResponse } from 'next/server';

import { catalogServerService } from '@/modules/catalog/services/catalog-server.service';
import { updateVariantDetailsSchema, variantRouteParamSchema } from '@/modules/catalog/validators';
import { apiNotFound, apiSuccess, apiValidationError } from '@/lib/api-response';
import { withApiRoute } from '@/lib/api/with-api-route';

type RouteParams = { id: string; variantId: string };

/** Patch a variant's CORE fields (name/group/barcode/price/cost) — SKU stays immutable. */
export const PATCH = withApiRoute<RouteParams>(
  async (request, { org, params }) => {
    const parsedParams = variantRouteParamSchema.safeParse(await params);
    if (!parsedParams.success) return apiNotFound('Variant not found');

    const body: unknown = await request.json();
    const parsed = updateVariantDetailsSchema.safeParse(body);
    if (!parsed.success) return apiValidationError(parsed.error);

    // updateVariantDetails matches by variantId + org; the [id] segment is URL scoping only.
    const variant = await catalogServerService.updateVariantDetails(
      org.id,
      parsedParams.data.variantId,
      parsed.data,
    );
    return apiSuccess(variant);
  },
  { requireAuth: true },
);

export function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
