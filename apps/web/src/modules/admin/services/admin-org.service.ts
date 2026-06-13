import 'server-only';

import { DEFAULT_STORAGE_QUOTA_BYTES } from '@falka/config/limits';
import { prisma } from '@falka/db';

import { auditService } from '@/modules/audit/services/audit.service';
import { hashPassword } from '@/modules/auth/utils/password';

import { AdminError } from '../errors/admin-errors';
import type { AdminOrgListItem, CreateOrganizationResult } from '../types';
import type { CreateOrganizationInput, UpdateOrganizationConfigInput } from '../validators';

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Platform admin-ops provisioning: the operator (a `UserRole.ADMIN`) creates
 * organizations + their first OWNER account, and edits per-org config. Stock
 * writes / member writes still belong to their own modules — this service only
 * owns org provisioning and config.
 */
export class AdminOrgService {
  /**
   * Create an Organization, its first OWNER user, and the OWNER membership in
   * ONE transaction. Email is normalized + pre-checked for a duplicate (mirrors
   * auth.service's registration); the unique index on `User.email` is the final
   * race guard. Audit is fired best-effort AFTER the tx so the trail never
   * breaks provisioning.
   */
  async createOrganizationWithOwner(
    input: CreateOrganizationInput,
    actorUserId: string,
  ): Promise<CreateOrganizationResult> {
    const ownerEmail = normalizeEmail(input.owner.email);

    const existing = await prisma.user.findUnique({
      where: { email: ownerEmail },
      select: { id: true },
    });

    if (existing) {
      throw AdminError.emailTaken();
    }

    const passwordHash = await hashPassword(input.owner.password);
    const displayName = input.owner.displayName?.trim() || null;

    const result = await prisma.$transaction(async (tx) => {
      const organization = await tx.organization.create({
        data: {
          name: input.orgName.trim(),
          plan: input.plan ?? 'FREE',
          memberLimit: input.memberLimit ?? null,
          storageQuotaBytes: BigInt(DEFAULT_STORAGE_QUOTA_BYTES),
        },
        select: { id: true },
      });

      const owner = await tx.user.create({
        data: {
          email: ownerEmail,
          passwordHash,
          displayName,
        },
        select: { id: true },
      });

      await tx.organizationMember.create({
        data: {
          organizationId: organization.id,
          userId: owner.id,
          role: 'OWNER',
        },
      });

      return { organizationId: organization.id, ownerUserId: owner.id };
    });

    await auditService.log({
      organizationId: result.organizationId,
      actorUserId,
      action: 'admin.org.created',
      resource: 'organization',
      resourceId: result.organizationId,
      metadata: { ownerEmail, plan: input.plan ?? 'FREE' },
    });

    return result;
  }

  /** All live organizations, newest first, with owner email + member count. */
  async listOrganizations(): Promise<AdminOrgListItem[]> {
    const organizations = await prisma.organization.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        name: true,
        plan: true,
        memberLimit: true,
        storageQuotaBytes: true,
        storageUsedBytes: true,
        createdAt: true,
        _count: { select: { members: true } },
        members: {
          where: { role: 'OWNER' },
          select: { user: { select: { email: true } } },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return organizations.map((org) => ({
      id: org.id,
      name: org.name,
      plan: org.plan,
      memberLimit: org.memberLimit,
      storageQuotaBytes: org.storageQuotaBytes.toString(),
      storageUsedBytes: org.storageUsedBytes.toString(),
      memberCount: org._count.members,
      ownerEmail: org.members[0]?.user.email ?? null,
      createdAt: org.createdAt.toISOString(),
    }));
  }

  /** Edit an org's config (name/plan/memberLimit/storageQuota). */
  async updateOrganizationConfig(
    organizationId: string,
    config: UpdateOrganizationConfigInput,
    actorUserId: string,
  ): Promise<void> {
    const existing = await prisma.organization.findFirst({
      where: { id: organizationId, deletedAt: null },
      select: { id: true },
    });

    if (!existing) {
      throw AdminError.orgNotFound();
    }

    await prisma.organization.update({
      where: { id: organizationId },
      data: {
        ...(config.name !== undefined ? { name: config.name } : {}),
        ...(config.plan !== undefined ? { plan: config.plan } : {}),
        ...(config.memberLimit !== undefined ? { memberLimit: config.memberLimit } : {}),
        ...(config.storageQuotaBytes !== undefined
          ? { storageQuotaBytes: BigInt(config.storageQuotaBytes) }
          : {}),
      },
    });

    await auditService.log({
      organizationId,
      actorUserId,
      action: 'admin.org.updated',
      resource: 'organization',
      resourceId: organizationId,
      metadata: { ...config },
    });
  }
}

export const adminOrgService = new AdminOrgService();
