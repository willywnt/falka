import { NextResponse } from 'next/server';

import { getCurrentUser } from '@/modules/auth/services/session';
import { inventoryServerService } from '@/modules/inventory/services/inventory-server.service';
import { releaseStockSchema, variantIdParamSchema } from '@/modules/inventory/validators';
import {
  apiSuccess,
  apiUnauthorized,
  apiValidationError,
  handleApiError,
} from '@/lib/api-response';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiUnauthorized();

    const params = await context.params;
    const parsedParams = variantIdParamSchema.safeParse(params);

    if (!parsedParams.success) {
      return apiValidationError(parsedParams.error);
    }

    const body: unknown = await request.json();
    const parsedBody = releaseStockSchema.safeParse(body);

    if (!parsedBody.success) {
      return apiValidationError(parsedBody.error);
    }

    const result = await inventoryServerService.releaseStock(
      user.id,
      parsedParams.data.id,
      parsedBody.data,
    );

    return apiSuccess(result);
  } catch (error) {
    return handleApiError(error);
  }
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
