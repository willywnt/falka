import { NextResponse } from 'next/server';

import { apiSuccess, apiValidationError } from '@/lib/api-response';
import { withApiRoute } from '@/lib/api/with-api-route';
import { budgetServerService } from '@/modules/finance/services/budget-server.service';
import { upsertBudgetsSchema } from '@/modules/finance/validators/budget';

export const GET = withApiRoute(
  async (_request, { org }) => {
    const budgets = await budgetServerService.listBudgets(org.id);
    return apiSuccess(budgets);
  },
  { requireAuth: true, requirePermission: 'finance.view' },
);

export const PATCH = withApiRoute(
  async (request, { user, org }) => {
    const body: unknown = await request.json().catch(() => ({}));
    const parsed = upsertBudgetsSchema.safeParse(body);
    if (!parsed.success) return apiValidationError(parsed.error);

    const budgets = await budgetServerService.upsertBudgets(org.id, user.id, parsed.data);
    return apiSuccess(budgets);
  },
  { requireAuth: true, requirePermission: 'finance.manage' },
);

export function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
