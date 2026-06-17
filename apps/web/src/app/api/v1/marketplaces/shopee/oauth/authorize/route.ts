import { NextResponse } from 'next/server';

import { withApiRoute } from '@/lib/api/with-api-route';
import { shopeeOAuthService } from '@/modules/marketplace/services/shopee-oauth.service';

/**
 * Starts the Shopee OAuth flow: mints a signed shop-authorization URL (state-bearing, for
 * the signed-in org) and redirects the seller to Shopee. Gated by marketplace.manage.
 */
export const GET = withApiRoute(
  async (_request, { org, user }) => {
    const url = shopeeOAuthService.buildAuthorizeUrl({
      organizationId: org.id,
      actorUserId: user.id,
    });
    return NextResponse.redirect(url);
  },
  { requireAuth: true, requirePermission: 'marketplace.manage' },
);
