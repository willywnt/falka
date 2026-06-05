import { NextResponse } from 'next/server';

import { catalogServerService } from '@/modules/catalog/services/catalog-server.service';
import { labelVariantsQuerySchema } from '@/modules/catalog/validators';
import { apiSuccess, apiValidationError } from '@/lib/api-response';
import { withApiRoute } from '@/lib/api/with-api-route';

export const GET = withApiRoute(
  async (request, { user }) => {
    const parsed = labelVariantsQuerySchema.safeParse({
      q: new URL(request.url).searchParams.get('q') ?? '',
    });
    if (!parsed.success) return apiValidationError(parsed.error);

    const data = await catalogServerService.listLabelVariants(user.id, parsed.data.q);
    return apiSuccess(data);
  },
  { requireAuth: true },
);

export function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
