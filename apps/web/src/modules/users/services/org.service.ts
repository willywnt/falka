import 'server-only';

import { prisma } from '@falka/db';
import type { OrgRole } from '@prisma/client';

import { AppError } from '@/lib/errors';

import type { OrgSummary } from '../types';

export class OrgService {
  async getSummary(organizationId: string, role: OrgRole): Promise<OrgSummary> {
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { id: true, name: true, deletedAt: true },
    });

    if (!organization || organization.deletedAt) {
      throw AppError.notFound('Organisasi tidak ditemukan');
    }

    return { id: organization.id, name: organization.name, role };
  }

  async rename(organizationId: string, name: string): Promise<OrgSummary['name']> {
    const updated = await prisma.organization.update({
      where: { id: organizationId },
      data: { name },
      select: { name: true },
    });

    return updated.name;
  }
}

export const orgService = new OrgService();
