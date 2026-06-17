import { NextResponse } from 'next/server';

import { apiNotFound, apiSuccess } from '@/lib/api-response';
import { withApiRoute } from '@/lib/api/with-api-route';
import { getConnectionOAuthService } from '@/modules/marketplace/services/connection-oauth';
import { marketplaceServerService } from '@/modules/marketplace/services/marketplace-server.service';
import { marketplaceConnectionIdSchema } from '@/modules/marketplace/validators/connection-id';

type RouteParams = { id: string };

export const POST = withApiRoute<RouteParams>(
  async (_request, { user, org, params }) => {
    const parsed = marketplaceConnectionIdSchema.safeParse(await params);
    if (!parsed.success) return apiNotFound('Marketplace connection not found');

    const existing = await marketplaceServerService.getConnectionById(org.id, parsed.data.id);
    const service = getConnectionOAuthService(existing.provider);
    if (!service) return apiNotFound('Refresh token tidak didukung untuk provider ini.');

    await service.refreshConnection(org.id, user.id, parsed.data.id);
    const connection = await marketplaceServerService.getConnectionById(org.id, parsed.data.id);
    return apiSuccess(connection);
  },
  { requireAuth: true, requirePermission: 'marketplace.manage' },
);

export function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
