import { NextResponse } from 'next/server';

import { appLogger } from '@/lib/logger';
import { tokopediaOAuthService } from '@/modules/marketplace/services/tokopedia-oauth.service';

/**
 * TikTok Shop redirects the seller back here with ?code & ?state. Public on purpose — the
 * redirect may not carry the Palka session, so the encrypted state (minted by the gated
 * authorize route) is the authority for which org gets the connection. We swap the code,
 * resolve the shop_cipher, create the connection, then bounce to /dashboard/marketplace (the
 * real page — /marketplace is a legacy redirect that would DROP the ?tokopedia query).
 */
function marketplaceRedirect(
  request: Request,
  status: 'connected' | 'error',
  reason?: string,
): Response {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;
  const target = new URL('/dashboard/marketplace', appUrl);
  target.searchParams.set('tokopedia', status);
  if (reason) target.searchParams.set('reason', reason.slice(0, 140));
  return NextResponse.redirect(target);
}

export async function GET(request: Request): Promise<Response> {
  const params = new URL(request.url).searchParams;
  const code = params.get('code');
  const state = params.get('state');

  if (params.get('error') || !code || !state) {
    appLogger.warn('marketplace.tokopedia.oauth.callback_rejected', {
      error: params.get('error') ?? undefined,
      hasCode: Boolean(code),
      hasState: Boolean(state),
    });
    return marketplaceRedirect(request, 'error', params.get('error') ?? 'missing code/state');
  }

  try {
    await tokopediaOAuthService.handleCallback({ code, state });
    return marketplaceRedirect(request, 'connected');
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    appLogger.warn('marketplace.tokopedia.oauth.callback_failed', { error: reason });
    return marketplaceRedirect(request, 'error', reason);
  }
}
