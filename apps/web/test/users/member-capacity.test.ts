import { beforeEach, describe, expect, it, vi } from 'vitest';

import { assertMemberCapacity } from '@/modules/users/services/member-capacity';

/**
 * The plan's seat cap: an active member OR a usable invite takes a seat. null
 * limit = unlimited. Pass a mock client (works for both prisma and a tx client).
 */
function makeClient(memberLimit: number | null, members: number, pending: number) {
  return {
    organization: { findUnique: vi.fn(async () => ({ memberLimit })) },
    organizationMember: { count: vi.fn(async () => members) },
    organizationInvite: { count: vi.fn(async () => pending) },
  } as unknown as Parameters<typeof assertMemberCapacity>[0];
}

describe('assertMemberCapacity', () => {
  beforeEach(() => vi.clearAllMocks());

  it('allows unlimited orgs (null limit) without counting', async () => {
    const client = makeClient(null, 99, 99);
    await expect(assertMemberCapacity(client, 'org-1')).resolves.toBeUndefined();
  });

  it('allows when members + pending invites are below the limit', async () => {
    const client = makeClient(3, 1, 1);
    await expect(assertMemberCapacity(client, 'org-1')).resolves.toBeUndefined();
  });

  it('blocks when seats (members + pending) reach the limit', async () => {
    const client = makeClient(2, 1, 1);
    await expect(assertMemberCapacity(client, 'org-1')).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
    });
  });
});
