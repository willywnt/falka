import { NextResponse } from 'next/server';

import { auditService } from '@/modules/audit/services/audit.service';
import { parseListAuditLogsQuery } from '@/modules/audit/validators';
import { apiSuccess, apiValidationError } from '@/lib/api-response';
import { withApiRoute } from '@/lib/api/with-api-route';

export const GET = withApiRoute(
  async (request, { org }) => {
    const parsed = parseListAuditLogsQuery(new URL(request.url).searchParams);
    if (!parsed.success) return apiValidationError(parsed.error);

    const result = await auditService.list(org.id, parsed.data);
    return apiSuccess(result);
  },
  { requireAuth: true, minOrgRole: 'ADMIN' },
);

export function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
