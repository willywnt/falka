import 'server-only';

import { prisma } from '@palka/db';
import type { Prisma } from '@prisma/client';

import { appLogger } from '@/lib/logger';
import { auditService } from '@/modules/audit/services/audit.service';

import { SupplierError } from '../errors/supplier-errors';
import type { SupplierDetail, SupplierListItem, SupplierOption } from '../types';
import type { CreateSupplierInput, UpdateSupplierInput } from '../validators/supplier';

type SupplierRow = Prisma.SupplierGetPayload<{
  include: { _count: { select: { purchaseOrders: true; productVariants: true } } };
}>;

function mapSupplier(row: SupplierRow): SupplierListItem {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    note: row.note,
    defaultLeadTimeDays: row.defaultLeadTimeDays,
    defaultMinOrderQty: row.defaultMinOrderQty,
    isActive: row.isActive,
    purchaseOrderCount: row._count.purchaseOrders,
    variantCount: row._count.productVariants,
    createdAt: row.createdAt.toISOString(),
  };
}

const COUNT_INCLUDE = {
  _count: { select: { purchaseOrders: true, productVariants: true } },
} satisfies Prisma.SupplierInclude;

/**
 * Suppliers/vendors for purchasing. A supplier carries default lead time / MOQ that the
 * reorder report falls back to (per the variant's preferred supplier) when a variant's own
 * values are null. Org-scoped; soft-deleted so PO history + variant links survive.
 */
export class SupplierServerService {
  /** All non-deleted suppliers with usage counts (active first, then by name). */
  async listSuppliers(organizationId: string): Promise<SupplierListItem[]> {
    const rows = await prisma.supplier.findMany({
      where: { organizationId, deletedAt: null },
      include: COUNT_INCLUDE,
      orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
    });
    return rows.map(mapSupplier);
  }

  /** Active suppliers as lightweight picker options (PO form, variant edit). */
  async listSupplierOptions(organizationId: string): Promise<SupplierOption[]> {
    const rows = await prisma.supplier.findMany({
      where: { organizationId, deletedAt: null, isActive: true },
      select: { id: true, name: true, defaultLeadTimeDays: true, defaultMinOrderQty: true },
      orderBy: { name: 'asc' },
    });
    return rows;
  }

  async getSupplier(organizationId: string, id: string): Promise<SupplierDetail> {
    const row = await this.getOwnedSupplier(id, organizationId);
    return mapSupplier(row);
  }

  async createSupplier(
    organizationId: string,
    actorUserId: string,
    input: CreateSupplierInput,
  ): Promise<SupplierDetail> {
    const row = await prisma.supplier.create({
      data: {
        userId: actorUserId,
        organizationId,
        name: input.name,
        phone: input.phone ?? null,
        note: input.note ?? null,
        defaultLeadTimeDays: input.defaultLeadTimeDays ?? null,
        defaultMinOrderQty: input.defaultMinOrderQty ?? null,
      },
      include: COUNT_INCLUDE,
    });

    appLogger.info('purchasing.supplier.created', { organizationId, supplierId: row.id });
    void auditService.log({
      organizationId,
      actorUserId,
      action: 'supplier.created',
      resource: 'supplier',
      metadata: { supplierId: row.id, name: row.name },
    });

    return mapSupplier(row);
  }

  async updateSupplier(
    organizationId: string,
    actorUserId: string,
    id: string,
    input: UpdateSupplierInput,
  ): Promise<SupplierDetail> {
    await this.getOwnedSupplier(id, organizationId);

    // Only touch fields the caller sent; null clears, undefined leaves as-is.
    const data: Prisma.SupplierUpdateInput = {};
    if (input.name !== undefined) data.name = input.name;
    if (input.phone !== undefined) data.phone = input.phone;
    if (input.note !== undefined) data.note = input.note;
    if (input.defaultLeadTimeDays !== undefined)
      data.defaultLeadTimeDays = input.defaultLeadTimeDays;
    if (input.defaultMinOrderQty !== undefined) data.defaultMinOrderQty = input.defaultMinOrderQty;
    if (input.isActive !== undefined) data.isActive = input.isActive;

    const row = await prisma.supplier.update({ where: { id }, data, include: COUNT_INCLUDE });

    appLogger.info('purchasing.supplier.updated', { organizationId, supplierId: id });
    void auditService.log({
      organizationId,
      actorUserId,
      action: 'supplier.updated',
      resource: 'supplier',
      metadata: { supplierId: id, name: row.name },
    });

    return mapSupplier(row);
  }

  /**
   * Soft-delete a supplier. PO history + variant `supplierId` links intentionally stay (the
   * row remains, just `deletedAt`/`isActive` flip) so nothing dangles; lists + pickers filter
   * `deletedAt: null`.
   */
  async deleteSupplier(
    organizationId: string,
    actorUserId: string,
    id: string,
  ): Promise<{ id: string }> {
    const supplier = await this.getOwnedSupplier(id, organizationId);
    if (supplier.deletedAt) return { id };

    await prisma.supplier.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });

    appLogger.info('purchasing.supplier.deleted', { organizationId, supplierId: id });
    void auditService.log({
      organizationId,
      actorUserId,
      action: 'supplier.deleted',
      resource: 'supplier',
      metadata: { supplierId: id, name: supplier.name },
    });

    return { id };
  }

  private async getOwnedSupplier(id: string, organizationId: string): Promise<SupplierRow> {
    const row = await prisma.supplier.findFirst({
      where: { id, organizationId, deletedAt: null },
      include: COUNT_INCLUDE,
    });
    if (!row) throw SupplierError.notFound();
    return row;
  }
}

export const supplierServerService = new SupplierServerService();
