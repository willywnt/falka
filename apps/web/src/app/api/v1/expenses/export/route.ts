import { NextResponse } from 'next/server';

import { apiValidationError } from '@/lib/api-response';
import { withApiRoute } from '@/lib/api/with-api-route';
import { expenseServerService } from '@/modules/finance/services/expense-server.service';
import { expensesToCsv } from '@/modules/finance/utils/expense-csv';
import { listExpensesQuerySchema } from '@/modules/finance/validators/expense';

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
    const csv = expensesToCsv(expenses);

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="pengeluaran.csv"',
      },
    });
  },
  { requireAuth: true, requirePermission: 'finance.view' },
);

export function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
