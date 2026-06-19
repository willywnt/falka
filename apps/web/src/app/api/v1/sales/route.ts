import { NextResponse } from 'next/server';

import { salesServerService } from '@/modules/sales/services/sales-server.service';
import { createSaleSchema } from '@/modules/sales/validators/create-sale';
import { listSalesQuerySchema } from '@/modules/sales/validators/list-sales';
import { apiSuccess, apiValidationError } from '@/lib/api-response';
import { withApiRoute } from '@/lib/api/with-api-route';

export const GET = withApiRoute(
  async (request, { org }) => {
    const searchParams = new URL(request.url).searchParams;
    const parsed = listSalesQuerySchema.safeParse({
      page: searchParams.get('page') ?? undefined,
      pageSize: searchParams.get('pageSize') ?? undefined,
      search: searchParams.get('search') ?? undefined,
    });
    if (!parsed.success) return apiValidationError(parsed.error);

    const sales = await salesServerService.listSales(org.id, parsed.data);
    return apiSuccess(sales);
  },
  { requireAuth: true },
);

export const POST = withApiRoute(
  async (request, { user, org }) => {
    const body: unknown = await request.json().catch(() => ({}));
    const parsed = createSaleSchema.safeParse(body);
    if (!parsed.success) return apiValidationError(parsed.error);

    const sale = await salesServerService.createSale(org.id, user.id, parsed.data);
    return apiSuccess(sale, 201);
  },
  { requireAuth: true, rateLimit: 'write' },
);

export function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
