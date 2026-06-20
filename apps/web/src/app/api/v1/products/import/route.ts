import { NextResponse } from 'next/server';

import { productImportService } from '@/modules/catalog/services/product-import.service';
import { importProductsSchema } from '@/modules/catalog/validators';
import { apiSuccess, apiValidationError } from '@/lib/api-response';
import { withApiRoute } from '@/lib/api/with-api-route';

export const POST = withApiRoute(
  async (request, { user, org }) => {
    const body: unknown = await request.json().catch(() => ({}));
    const parsed = importProductsSchema.safeParse(body);
    if (!parsed.success) return apiValidationError(parsed.error);

    const report = await productImportService.import(
      org.id,
      user.id,
      parsed.data.csv,
      parsed.data.commit,
    );

    return apiSuccess(report);
  },
  { requireAuth: true, requirePermission: 'catalog.import', rateLimit: 'write' },
);

export function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
