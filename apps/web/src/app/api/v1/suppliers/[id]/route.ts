import { NextResponse } from 'next/server';

import { apiNotFound, apiSuccess, apiValidationError } from '@/lib/api-response';
import { withApiRoute } from '@/lib/api/with-api-route';
import { supplierServerService } from '@/modules/purchasing/services/supplier-server.service';
import { supplierIdSchema, updateSupplierSchema } from '@/modules/purchasing/validators/supplier';

type RouteParams = { id: string };

export const GET = withApiRoute<RouteParams>(
  async (_request, { org, params }) => {
    const parsed = supplierIdSchema.safeParse(await params);
    if (!parsed.success) return apiNotFound('Supplier not found');

    const supplier = await supplierServerService.getSupplier(org.id, parsed.data.id);
    return apiSuccess(supplier);
  },
  { requireAuth: true, requirePermission: 'purchasing.view' },
);

export const PATCH = withApiRoute<RouteParams>(
  async (request, { user, org, params }) => {
    const parsedId = supplierIdSchema.safeParse(await params);
    if (!parsedId.success) return apiNotFound('Supplier not found');

    const body: unknown = await request.json().catch(() => ({}));
    const parsed = updateSupplierSchema.safeParse(body);
    if (!parsed.success) return apiValidationError(parsed.error);

    const supplier = await supplierServerService.updateSupplier(
      org.id,
      user.id,
      parsedId.data.id,
      parsed.data,
    );
    return apiSuccess(supplier);
  },
  { requireAuth: true, requirePermission: 'purchasing.view' },
);

export const DELETE = withApiRoute<RouteParams>(
  async (_request, { user, org, params }) => {
    const parsed = supplierIdSchema.safeParse(await params);
    if (!parsed.success) return apiNotFound('Supplier not found');

    const result = await supplierServerService.deleteSupplier(org.id, user.id, parsed.data.id);
    return apiSuccess(result);
  },
  { requireAuth: true, requirePermission: 'purchasing.view' },
);

export function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
