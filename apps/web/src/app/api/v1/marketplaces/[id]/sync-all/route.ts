import { NextResponse } from 'next/server';

import { apiNotFound, apiSuccess } from '@/lib/api-response';
import { withApiRoute } from '@/lib/api/with-api-route';
import { marketplaceMappingService } from '@/modules/marketplace/services/marketplace-mapping.service';
import { marketplaceConnectionIdSchema } from '@/modules/marketplace/validators/connection-id';

type RouteParams = { id: string };

export const POST = withApiRoute<RouteParams>(
  async (_request, { user, org, params }) => {
    const parsed = marketplaceConnectionIdSchema.safeParse(await params);
    if (!parsed.success) return apiNotFound('Marketplace connection not found');

    const result = await marketplaceMappingService.syncAllListings(org.id, user.id, parsed.data.id);
    return apiSuccess(result);
  },
  { requireAuth: true, requirePermission: 'marketplace.manage' },
);

export function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
