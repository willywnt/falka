import { NextResponse } from 'next/server';

import { catalogServerService } from '@/modules/catalog/services/catalog-server.service';
import { createVariantSchema, productIdParamSchema } from '@/modules/catalog/validators';
import { apiNotFound, apiSuccess, apiValidationError } from '@/lib/api-response';
import { withApiRoute } from '@/lib/api/with-api-route';

type RouteParams = { id: string };

export const POST = withApiRoute<RouteParams>(
  async (request, { user, params }) => {
    const parsedParams = productIdParamSchema.safeParse(await params);
    if (!parsedParams.success) return apiNotFound('Product not found');

    const body: unknown = await request.json();
    const parsed = createVariantSchema.safeParse(body);
    if (!parsed.success) return apiValidationError(parsed.error);

    const variant = await catalogServerService.addVariant(
      user.id,
      parsedParams.data.id,
      parsed.data,
    );
    return apiSuccess(variant, 201);
  },
  { requireAuth: true },
);

export function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
