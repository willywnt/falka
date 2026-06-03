import { NextResponse } from 'next/server';

import { inventoryActivityService } from '@/modules/inventory/services/inventory-activity.service';
import { stockActivityToCsv } from '@/modules/inventory/utils/stock-activity-csv';
import { parseStockActivityQuery } from '@/modules/inventory/validators';
import { apiValidationError } from '@/lib/api-response';
import { withApiRoute } from '@/lib/api/with-api-route';

export const GET = withApiRoute(
  async (request, { user }) => {
    const parsed = parseStockActivityQuery(new URL(request.url).searchParams);
    if (!parsed.success) return apiValidationError(parsed.error);

    const items = await inventoryActivityService.listForExport(user.id, parsed.data);
    const csv = stockActivityToCsv(items);

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="stock-activity.csv"',
      },
    });
  },
  { requireAuth: true },
);

export function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
