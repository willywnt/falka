import { NextResponse } from 'next/server';

import { apiNotFound, apiSuccess, apiValidationError } from '@/lib/api-response';
import { withApiRoute } from '@/lib/api/with-api-route';
import { expenseServerService } from '@/modules/finance/services/expense-server.service';
import { expenseIdSchema, updateExpenseSchema } from '@/modules/finance/validators/expense';

type RouteParams = { id: string };

export const GET = withApiRoute<RouteParams>(
  async (_request, { org, params }) => {
    const parsed = expenseIdSchema.safeParse(await params);
    if (!parsed.success) return apiNotFound('Expense not found');

    const expense = await expenseServerService.getExpense(org.id, parsed.data.id);
    return apiSuccess(expense);
  },
  { requireAuth: true, requirePermission: 'finance.view' },
);

export const PATCH = withApiRoute<RouteParams>(
  async (request, { user, org, params }) => {
    const parsedId = expenseIdSchema.safeParse(await params);
    if (!parsedId.success) return apiNotFound('Expense not found');

    const body: unknown = await request.json().catch(() => ({}));
    const parsed = updateExpenseSchema.safeParse(body);
    if (!parsed.success) return apiValidationError(parsed.error);

    const expense = await expenseServerService.updateExpense(
      org.id,
      user.id,
      parsedId.data.id,
      parsed.data,
    );
    return apiSuccess(expense);
  },
  { requireAuth: true, requirePermission: 'finance.manage' },
);

export const DELETE = withApiRoute<RouteParams>(
  async (_request, { user, org, params }) => {
    const parsed = expenseIdSchema.safeParse(await params);
    if (!parsed.success) return apiNotFound('Expense not found');

    const result = await expenseServerService.deleteExpense(org.id, user.id, parsed.data.id);
    return apiSuccess(result);
  },
  { requireAuth: true, requirePermission: 'finance.manage' },
);

export function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
