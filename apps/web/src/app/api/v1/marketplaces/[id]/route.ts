import { NextResponse } from 'next/server';

import { getCurrentUser } from '@/modules/auth/services/session';
import { MarketplaceError } from '@/modules/marketplace/errors/marketplace-errors';
import { marketplaceServerService } from '@/modules/marketplace/services/marketplace-server.service';
import { marketplaceConnectionIdSchema } from '@/modules/marketplace/validators/connection-id';
import {
  apiError,
  apiNotFound,
  apiSuccess,
  apiUnauthorized,
  handleApiError,
} from '@/lib/api-response';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiUnauthorized();

    const params = await context.params;
    const parsed = marketplaceConnectionIdSchema.safeParse(params);

    if (!parsed.success) {
      return apiNotFound('Marketplace connection not found');
    }

    const connection = await marketplaceServerService.getConnectionById(user.id, parsed.data.id);
    return apiSuccess(connection);
  } catch (error) {
    if (error instanceof MarketplaceError) {
      return apiError({ code: error.code, message: error.message }, error.statusCode);
    }

    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiUnauthorized();

    const params = await context.params;
    const parsed = marketplaceConnectionIdSchema.safeParse(params);

    if (!parsed.success) {
      return apiNotFound('Marketplace connection not found');
    }

    const connection = await marketplaceServerService.disconnectConnection(user.id, parsed.data.id);
    return apiSuccess(connection);
  } catch (error) {
    if (error instanceof MarketplaceError) {
      return apiError({ code: error.code, message: error.message }, error.statusCode);
    }

    return handleApiError(error);
  }
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
