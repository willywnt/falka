import { NextResponse } from 'next/server';

import { orgService } from '@/modules/users/services/org.service';
import { renameOrgSchema } from '@/modules/users/validators/org';
import { apiSuccess, apiValidationError } from '@/lib/api-response';
import { withApiRoute } from '@/lib/api/with-api-route';

export const GET = withApiRoute(
  async (_request, { org }) => {
    const summary = await orgService.getSummary(org.id, org.role, [...org.permissions]);
    return apiSuccess(summary);
  },
  { requireAuth: true },
);

export const PATCH = withApiRoute(
  async (request, { org }) => {
    const body: unknown = await request.json().catch(() => ({}));
    const parsed = renameOrgSchema.safeParse(body);
    if (!parsed.success) return apiValidationError(parsed.error);

    const name = await orgService.rename(org.id, parsed.data.name);
    return apiSuccess({ name });
  },
  { requireAuth: true, minOrgRole: 'OWNER' },
);

export function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
