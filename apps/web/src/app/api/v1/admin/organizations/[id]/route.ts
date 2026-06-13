import { NextResponse } from 'next/server';

import { apiSuccess, apiValidationError } from '@/lib/api-response';
import { withApiRoute } from '@/lib/api/with-api-route';
import { adminOrgService } from '@/modules/admin/services/admin-org.service';
import { updateOrganizationConfigSchema } from '@/modules/admin/validators';

export const PATCH = withApiRoute<{ id: string }>(
  async (request, { params, user }) => {
    const { id } = await params;
    const body: unknown = await request.json().catch(() => ({}));
    const parsed = updateOrganizationConfigSchema.safeParse(body);
    if (!parsed.success) return apiValidationError(parsed.error);

    await adminOrgService.updateOrganizationConfig(id, parsed.data, user.id);
    return apiSuccess({ ok: true });
  },
  { requireAdmin: true },
);

export function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
