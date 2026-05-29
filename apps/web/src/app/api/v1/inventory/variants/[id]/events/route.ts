import { NextResponse } from 'next/server';

import { getCurrentUser } from '@/modules/auth/services/session';
import { inventoryServerService } from '@/modules/inventory/services/inventory-server.service';
import {
  listInventoryHistoryQuerySchema,
  variantIdParamSchema,
} from '@/modules/inventory/validators';
import {
  apiSuccess,
  apiUnauthorized,
  apiValidationError,
  handleApiError,
} from '@/lib/api-response';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiUnauthorized();

    const params = await context.params;
    const parsedParams = variantIdParamSchema.safeParse(params);

    if (!parsedParams.success) {
      return apiValidationError(parsedParams.error);
    }

    const { searchParams } = new URL(request.url);
    const parsedQuery = listInventoryHistoryQuerySchema.safeParse({
      limit: searchParams.get('limit') ?? undefined,
      cursor: searchParams.get('cursor') ?? undefined,
      type: searchParams.get('type') ?? undefined,
      actorId: searchParams.get('actorId') ?? undefined,
    });

    if (!parsedQuery.success) {
      return apiValidationError(parsedQuery.error);
    }

    const history = await inventoryServerService.getInventoryHistory(
      user.id,
      parsedParams.data.id,
      parsedQuery.data,
    );

    return apiSuccess(history.events);
  } catch (error) {
    return handleApiError(error);
  }
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
