import { NextResponse } from 'next/server';

import { inventoryDashboardService } from '@/modules/inventory/services/inventory-dashboard.service';
import { apiSuccess } from '@/lib/api-response';
import { withApiRoute } from '@/lib/api/with-api-route';

export const GET = withApiRoute(
  async (_request, { org }) => {
    const dashboard = await inventoryDashboardService.getDashboard(org.id);
    return apiSuccess(dashboard);
  },
  { requireAuth: true },
);

export function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
