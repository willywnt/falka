import { NextResponse } from 'next/server';

import { catalogServerService } from '@/modules/catalog/services/catalog-server.service';
import { markLabelsPrintedSchema } from '@/modules/catalog/validators';
import { apiSuccess, apiValidationError } from '@/lib/api-response';
import { withApiRoute } from '@/lib/api/with-api-route';

export const POST = withApiRoute(
  async (request, { user }) => {
    const body: unknown = await request.json().catch(() => null);
    const parsed = markLabelsPrintedSchema.safeParse(body);
    if (!parsed.success) return apiValidationError(parsed.error);

    await catalogServerService.markLabelsPrinted(user.id, parsed.data.variantIds);
    return apiSuccess({ ok: true });
  },
  { requireAuth: true },
);

export function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
