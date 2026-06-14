import { NextResponse } from 'next/server';

import { withApiRoute } from '@/lib/api/with-api-route';
import { lazadaOAuthService } from '@/modules/marketplace/services/lazada-oauth.service';

/**
 * Starts the Lazada OAuth flow: mints a state-bearing consent URL for the signed-in
 * org and redirects the seller to auth.lazada.com. Gated by marketplace.manage.
 */
export const GET = withApiRoute(
  async (_request, { org, user }) => {
    const url = lazadaOAuthService.buildAuthorizeUrl({
      organizationId: org.id,
      actorUserId: user.id,
    });
    return NextResponse.redirect(url);
  },
  { requireAuth: true, requirePermission: 'marketplace.manage' },
);
