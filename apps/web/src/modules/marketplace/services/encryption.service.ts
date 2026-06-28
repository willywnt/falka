import 'server-only';

import { getServerEnv } from '@palka/config/env.server';
import { decrypt, encrypt } from '@palka/utils/crypto';

import { MarketplaceError } from '../errors/marketplace-errors';

export class MarketplaceEncryptionService {
  private getSecret(): string {
    return getServerEnv().MARKETPLACE_ENCRYPTION_SECRET;
  }

  encryptToken(plaintext: string): string {
    try {
      return encrypt(plaintext, this.getSecret());
    } catch {
      throw MarketplaceError.encryption();
    }
  }

  decryptToken(payload: string): string {
    try {
      return decrypt(payload, this.getSecret());
    } catch {
      throw MarketplaceError.encryption('Failed to decrypt marketplace credentials.');
    }
  }

  /** Server-only helper for future token refresh jobs. Never expose to clients. */
  safeDecryptToken(payload: string | null | undefined): string | null {
    if (!payload) return null;

    try {
      return this.decryptToken(payload);
    } catch {
      return null;
    }
  }
}

export const marketplaceEncryptionService = new MarketplaceEncryptionService();
