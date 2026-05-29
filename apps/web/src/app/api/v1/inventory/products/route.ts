import { NextResponse } from 'next/server';

import { getCurrentUser } from '@/modules/auth/services/session';
import { inventoryServerService } from '@/modules/inventory/services/inventory-server.service';
import { createProductSchema, listProductsQuerySchema } from '@/modules/inventory/validators';
import {
  apiSuccess,
  apiUnauthorized,
  apiValidationError,
  handleApiError,
} from '@/lib/api-response';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiUnauthorized();

    const { searchParams } = new URL(request.url);
    const parsed = listProductsQuerySchema.safeParse({
      page: searchParams.get('page') ?? undefined,
      pageSize: searchParams.get('pageSize') ?? undefined,
      search: searchParams.get('search') ?? undefined,
      brand: searchParams.get('brand') ?? undefined,
      active: searchParams.get('active') ?? undefined,
      sortBy: searchParams.get('sortBy') ?? undefined,
      sortOrder: searchParams.get('sortOrder') ?? undefined,
    });

    if (!parsed.success) {
      return apiValidationError(parsed.error);
    }

    const result = await inventoryServerService.listProductsPaginated(user.id, parsed.data);
    return apiSuccess(result.items, 200, { ...result.meta });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiUnauthorized();

    const body: unknown = await request.json();
    const parsed = createProductSchema.safeParse(body);

    if (!parsed.success) {
      return apiValidationError(parsed.error);
    }

    const product = await inventoryServerService.createProduct(user.id, parsed.data);
    return apiSuccess(product, 201);
  } catch (error) {
    return handleApiError(error);
  }
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
