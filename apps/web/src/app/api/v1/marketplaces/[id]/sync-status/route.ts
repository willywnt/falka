import { NextResponse } from 'next/server';

import { apiNotFound, apiSuccess } from '@/lib/api-response';
import { withApiRoute } from '@/lib/api/with-api-route';
import { marketplaceMappingService } from '@/modules/marketplace/services/marketplace-mapping.service';
import { marketplaceConnectionIdSchema } from '@/modules/marketplace/validators/connection-id';

type RouteParams = { id: string };

export const GET = withApiRoute<RouteParams>(
  async (_request, { org, params }) => {
    const parsed = marketplaceConnectionIdSchema.safeParse(await params);
    if (!parsed.success) return apiNotFound('Marketplace connection not found');

    const inFlight = await marketplaceMappingService.getInFlightSyncProductIds(
      org.id,
      parsed.data.id,
    );
    return apiSuccess({ inFlight });
  },
  { requireAuth: true, requirePermission: 'marketplace.view' },
);

export function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
