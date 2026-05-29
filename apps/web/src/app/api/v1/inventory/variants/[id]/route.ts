import { NextResponse } from 'next/server';

import { getCurrentUser } from '@/modules/auth/services/session';
import { inventoryServerService } from '@/modules/inventory/services/inventory-server.service';
import {
  createProductVariantSchema,
  listVariantsQuerySchema,
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

export async function GET(_request: Request, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiUnauthorized();

    const params = await context.params;
    const parsed = variantIdParamSchema.safeParse(params);

    if (!parsed.success) {
      return apiValidationError(parsed.error);
    }

    const variant = await inventoryServerService.getVariantDetail(user.id, parsed.data.id);
    return apiSuccess(variant);
  } catch (error) {
    return handleApiError(error);
  }
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
