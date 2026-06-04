import { NextResponse } from 'next/server';

import { salesServerService } from '@/modules/sales/services/sales-server.service';
import { createSaleSchema } from '@/modules/sales/validators/create-sale';
import { apiSuccess, apiValidationError } from '@/lib/api-response';
import { withApiRoute } from '@/lib/api/with-api-route';

export const GET = withApiRoute(
  async (_request, { user }) => {
    const sales = await salesServerService.listSales(user.id);
    return apiSuccess(sales);
  },
  { requireAuth: true },
);

export const POST = withApiRoute(
  async (request, { user }) => {
    const body: unknown = await request.json().catch(() => ({}));
    const parsed = createSaleSchema.safeParse(body);
    if (!parsed.success) return apiValidationError(parsed.error);

    const sale = await salesServerService.createSale(user.id, parsed.data);
    return apiSuccess(sale, 201);
  },
  { requireAuth: true },
);

export function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
