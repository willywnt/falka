import {
  isAuthShopeeError,
  isMappingInvalidShopeeError,
  isTransientShopeeError,
} from '@palka/marketplace-providers';
import { describe, expect, it } from 'vitest';

/**
 * Pins how Shopee error codes/messages are classified — this decides whether a stock sync retries
 * (transient), re-authenticates (auth), auto-pauses the mapping (mapping-invalid), or fails plainly.
 */
describe('isTransientShopeeError — tiered throttles retry', () => {
  it('treats the QPS + daily-quota codes as transient', () => {
    expect(isTransientShopeeError('error_rate_limit')).toBe(true);
    expect(isTransientShopeeError('error_limit')).toBe(true); // daily quota
    expect(isTransientShopeeError('ads.rate_limit.exceed_shop_api')).toBe(true);
    expect(isTransientShopeeError('ads.rate_limit.exceed_partner_api')).toBe(true);
    expect(isTransientShopeeError('error_busy')).toBe(true);
    expect(isTransientShopeeError('', 'Too many requests, please try again')).toBe(true);
  });
  it('does not treat business/auth codes as transient', () => {
    expect(isTransientShopeeError('error_param')).toBe(false);
    expect(isTransientShopeeError('error_auth')).toBe(false);
  });
});

describe('isAuthShopeeError — re-auth (non-retryable, not a mapping problem)', () => {
  it('flags auth/token codes', () => {
    expect(isAuthShopeeError('error_auth')).toBe(true);
    expect(isAuthShopeeError('error_token')).toBe(true);
    expect(isAuthShopeeError('invalid_access_token')).toBe(true);
  });
  it('does not flag a rate-limit code as auth', () => {
    expect(isAuthShopeeError('error_rate_limit')).toBe(false);
    expect(isAuthShopeeError('error_param')).toBe(false);
  });
});

describe('isMappingInvalidShopeeError — listing gone / mismatch → auto-pause', () => {
  it('flags the real update_stock failure_list reason (variation item, model_id 0)', () => {
    expect(
      isMappingInvalidShopeeError(
        '',
        'model_id is mandatory if item is under model level, please input the model_id of the models that need to be update',
      ),
    ).toBe(true);
  });
  it('flags a deleted/missing listing', () => {
    expect(isMappingInvalidShopeeError('error_item_not_found')).toBe(true);
    expect(isMappingInvalidShopeeError('error_model_not_found')).toBe(true);
    expect(isMappingInvalidShopeeError('', 'the item does not exist')).toBe(true);
  });
  it('does NOT flag transient or generic-param errors (those must not auto-pause)', () => {
    expect(isMappingInvalidShopeeError('error_rate_limit')).toBe(false);
    expect(isMappingInvalidShopeeError('error_param', 'stock must be >= 0')).toBe(false);
  });
});
