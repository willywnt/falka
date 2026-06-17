import { NextResponse } from 'next/server';

import { withApiRoute } from '@/lib/api/with-api-route';
import { tokopediaOAuthService } from '@/modules/marketplace/services/tokopedia-oauth.service';

/**
 * Starts the Tokopedia (TikTok Shop) OAuth flow: mints a state-bearing authorization URL for the
 * signed-in org and redirects the seller to TikTok Shop. Gated by marketplace.manage.
 */
export const GET = withApiRoute(
  async (_request, { org, user }) => {
    const url = tokopediaOAuthService.buildAuthorizeUrl({
      organizationId: org.id,
      actorUserId: user.id,
    });
    return NextResponse.redirect(url);
  },
  { requireAuth: true, requirePermission: 'marketplace.manage' },
);
