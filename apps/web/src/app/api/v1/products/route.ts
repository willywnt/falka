import { NextResponse } from 'next/server';

import { catalogServerService } from '@/modules/catalog/services/catalog-server.service';
import { createProductSchema, listProductsQuerySchema } from '@/modules/catalog/validators';
import { apiSuccess, apiValidationError } from '@/lib/api-response';
import { withApiRoute } from '@/lib/api/with-api-route';

export const GET = withApiRoute(
  async (request, { user }) => {
    const url = new URL(request.url);
    const parsed = listProductsQuerySchema.safeParse({
      page: url.searchParams.get('page') ?? undefined,
      pageSize: url.searchParams.get('pageSize') ?? undefined,
      search: url.searchParams.get('search') ?? undefined,
    });

    if (!parsed.success) return apiValidationError(parsed.error);

    const result = await catalogServerService.listProducts(user.id, parsed.data);
    return apiSuccess(result.items, 200, { ...result.meta });
  },
  { requireAuth: true },
);

export const POST = withApiRoute(
  async (request, { user }) => {
    const body: unknown = await request.json();
    const parsed = createProductSchema.safeParse(body);

    if (!parsed.success) return apiValidationError(parsed.error);

    const product = await catalogServerService.createProduct(user.id, parsed.data);
    return apiSuccess(product, 201);
  },
  { requireAuth: true },
);

export function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
