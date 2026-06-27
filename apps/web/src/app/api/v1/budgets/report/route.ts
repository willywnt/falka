import { NextResponse } from 'next/server';

import { apiSuccess, apiValidationError } from '@/lib/api-response';
import { withApiRoute } from '@/lib/api/with-api-route';
import { budgetServerService } from '@/modules/finance/services/budget-server.service';
import { budgetReportQuerySchema } from '@/modules/finance/validators/budget';

export const GET = withApiRoute(
  async (request, { org }) => {
    const parsed = budgetReportQuerySchema.safeParse({
      month: new URL(request.url).searchParams.get('month') ?? '',
    });
    if (!parsed.success) return apiValidationError(parsed.error);

    const report = await budgetServerService.getBudgetReport(org.id, parsed.data.month);
    return apiSuccess(report);
  },
  { requireAuth: true, requirePermission: 'finance.view' },
);

export function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
