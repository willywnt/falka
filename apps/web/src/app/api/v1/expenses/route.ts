import { NextResponse } from 'next/server';

import { apiSuccess, apiValidationError } from '@/lib/api-response';
import { withApiRoute } from '@/lib/api/with-api-route';
import { expenseServerService } from '@/modules/finance/services/expense-server.service';
import { createExpenseSchema, listExpensesQuerySchema } from '@/modules/finance/validators/expense';

export const GET = withApiRoute(
  async (request, { org }) => {
    const searchParams = new URL(request.url).searchParams;
    const parsed = listExpensesQuerySchema.safeParse({
      from: searchParams.get('from') ?? undefined,
      to: searchParams.get('to') ?? undefined,
      category: searchParams.get('category') ?? undefined,
    });
    if (!parsed.success) return apiValidationError(parsed.error);

    const expenses = await expenseServerService.listExpenses(org.id, parsed.data);
    return apiSuccess(expenses);
  },
  { requireAuth: true, requirePermission: 'finance.view' },
);

export const POST = withApiRoute(
  async (request, { user, org }) => {
    const body: unknown = await request.json().catch(() => ({}));
    const parsed = createExpenseSchema.safeParse(body);
    if (!parsed.success) return apiValidationError(parsed.error);

    const expense = await expenseServerService.createExpense(org.id, user.id, parsed.data);
    return apiSuccess(expense, 201);
  },
  { requireAuth: true, requirePermission: 'finance.manage' },
);

export function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
