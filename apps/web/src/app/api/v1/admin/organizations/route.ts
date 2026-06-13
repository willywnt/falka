import { NextResponse } from 'next/server';

import { apiSuccess, apiValidationError } from '@/lib/api-response';
import { withApiRoute } from '@/lib/api/with-api-route';
import { adminOrgService } from '@/modules/admin/services/admin-org.service';
import { createOrganizationSchema } from '@/modules/admin/validators';

export const GET = withApiRoute(
  async () => {
    const organizations = await adminOrgService.listOrganizations();
    return apiSuccess(organizations);
  },
  { requireAdmin: true },
);

export const POST = withApiRoute(
  async (request, { user }) => {
    const body: unknown = await request.json().catch(() => ({}));
    const parsed = createOrganizationSchema.safeParse(body);
    if (!parsed.success) return apiValidationError(parsed.error);

    const result = await adminOrgService.createOrganizationWithOwner(parsed.data, user.id);
    return apiSuccess(result, 201);
  },
  { requireAdmin: true },
);

export function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
