import { NextResponse } from 'next/server';

import { buildProductTemplateXlsx } from '@/modules/catalog/utils/product-xlsx';
import { withApiRoute } from '@/lib/api/with-api-route';

const XLSX_CONTENT_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

/** A header-only .xlsx the user fills in for bulk import. */
export const GET = withApiRoute(
  async () => {
    const xlsx = buildProductTemplateXlsx();

    return new NextResponse(xlsx, {
      status: 200,
      headers: {
        'Content-Type': XLSX_CONTENT_TYPE,
        'Content-Disposition': 'attachment; filename="template-produk.xlsx"',
      },
    });
  },
  { requireAuth: true },
);

export function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
