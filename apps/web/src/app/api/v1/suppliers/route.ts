import { NextResponse } from 'next/server';

import { apiSuccess, apiValidationError } from '@/lib/api-response';
import { withApiRoute } from '@/lib/api/with-api-route';
import { supplierServerService } from '@/modules/purchasing/services/supplier-server.service';
import { createSupplierSchema } from '@/modules/purchasing/validators/supplier';

export const GET = withApiRoute(
  async (_request, { org }) => {
    const suppliers = await supplierServerService.listSuppliers(org.id);
    return apiSuccess(suppliers);
  },
  { requireAuth: true, requirePermission: 'purchasing.view' },
);

export const POST = withApiRoute(
  async (request, { user, org }) => {
    const body: unknown = await request.json().catch(() => ({}));
    const parsed = createSupplierSchema.safeParse(body);
    if (!parsed.success) return apiValidationError(parsed.error);

    const supplier = await supplierServerService.createSupplier(org.id, user.id, parsed.data);
    return apiSuccess(supplier, 201);
  },
  { requireAuth: true, requirePermission: 'purchasing.view' },
);

export function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
