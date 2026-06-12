import { NextResponse } from 'next/server';

import { purchasingServerService } from '@/modules/purchasing/services/purchasing-server.service';
import { resolveVariantQuerySchema } from '@/modules/purchasing/validators/resolve-variant';
import { apiSuccess, apiValidationError } from '@/lib/api-response';
import { withApiRoute } from '@/lib/api/with-api-route';

export const GET = withApiRoute(
  async (request, { org }) => {
    const parsed = resolveVariantQuerySchema.safeParse({
      code: new URL(request.url).searchParams.get('code') ?? '',
    });
    if (!parsed.success) return apiValidationError(parsed.error);

    const result = await purchasingServerService.resolveScannedItem(org.id, parsed.data.code);
    return apiSuccess(result);
  },
  { requireAuth: true },
);

export function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
