import { NextResponse } from 'next/server';

import { apiSuccess } from '@/lib/api-response';
import { withApiRoute } from '@/lib/api/with-api-route';
import { supplierServerService } from '@/modules/purchasing/services/supplier-server.service';

export const GET = withApiRoute(
  async (_request, { org }) => {
    const options = await supplierServerService.listSupplierOptions(org.id);
    return apiSuccess(options);
  },
  { requireAuth: true, requirePermission: 'purchasing.view' },
);

export function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
