import { NextResponse } from 'next/server';

import { catalogServerService } from '@/modules/catalog/services/catalog-server.service';
import { productIdParamSchema, updateProductSchema } from '@/modules/catalog/validators';
import { apiNotFound, apiSuccess, apiValidationError } from '@/lib/api-response';
import { withApiRoute } from '@/lib/api/with-api-route';

type RouteParams = { id: string };

export const GET = withApiRoute<RouteParams>(
  async (_request, { user, params }) => {
    const parsed = productIdParamSchema.safeParse(await params);
    if (!parsed.success) return apiNotFound('Product not found');

    const product = await catalogServerService.getProductById(user.id, parsed.data.id);
    return apiSuccess(product);
  },
  { requireAuth: true },
);

export const PATCH = withApiRoute<RouteParams>(
  async (request, { user, params }) => {
    const parsedParams = productIdParamSchema.safeParse(await params);
    if (!parsedParams.success) return apiNotFound('Product not found');

    const body: unknown = await request.json();
    const parsed = updateProductSchema.safeParse(body);
    if (!parsed.success) return apiValidationError(parsed.error);

    const product = await catalogServerService.updateProduct(
      user.id,
      parsedParams.data.id,
      parsed.data,
    );
    return apiSuccess(product);
  },
  { requireAuth: true },
);

export const DELETE = withApiRoute<RouteParams>(
  async (_request, { user, params }) => {
    const parsed = productIdParamSchema.safeParse(await params);
    if (!parsed.success) return apiNotFound('Product not found');

    await catalogServerService.deleteProduct(user.id, parsed.data.id);
    return apiSuccess({ id: parsed.data.id });
  },
  { requireAuth: true },
);

export function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
