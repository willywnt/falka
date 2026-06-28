import { NextResponse } from 'next/server';
import { z } from 'zod';

import { ordersServerService } from '@/modules/orders/services/orders-server.service';
import { apiSuccess, apiValidationError } from '@/lib/api-response';
import { withApiRoute } from '@/lib/api/with-api-route';

const querySchema = z.object({ trackingNumber: z.string().trim().min(1).max(64) });

export const GET = withApiRoute(
  async (request, { org }) => {
    const parsed = querySchema.safeParse({
      trackingNumber: new URL(request.url).searchParams.get('trackingNumber') ?? '',
    });
    if (!parsed.success) return apiValidationError(parsed.error);

    const data = await ordersServerService.findByResi(org.id, parsed.data.trackingNumber);
    return apiSuccess(data);
  },
  { requireAuth: true },
);

export function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
