import { NextResponse } from 'next/server';

import { appLogger } from '@/lib/logger';
import { lazadaOAuthService } from '@/modules/marketplace/services/lazada-oauth.service';

/**
 * Lazada redirects the seller back here with ?code & ?state. Public on purpose — the
 * redirect may not carry the Falka session, so the encrypted state (minted by the gated
 * authorize route) is the authority for which org gets the connection. We swap the code,
 * create the connection, then bounce the user to the marketplace page on the app origin.
 */
function marketplaceRedirect(request: Request, status: 'connected' | 'error'): Response {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;
  const target = new URL('/marketplace', appUrl);
  target.searchParams.set('lazada', status);
  return NextResponse.redirect(target);
}

export async function GET(request: Request): Promise<Response> {
  const params = new URL(request.url).searchParams;
  const code = params.get('code');
  const state = params.get('state');

  if (params.get('error') || !code || !state) {
    appLogger.warn('marketplace.lazada.oauth.callback_rejected', {
      error: params.get('error') ?? undefined,
      hasCode: Boolean(code),
      hasState: Boolean(state),
    });
    return marketplaceRedirect(request, 'error');
  }

  try {
    await lazadaOAuthService.handleCallback({ code, state });
    return marketplaceRedirect(request, 'connected');
  } catch (error) {
    appLogger.warn('marketplace.lazada.oauth.callback_failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    return marketplaceRedirect(request, 'error');
  }
}
