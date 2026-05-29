import 'server-only';

import type { Prisma } from '@prisma/client';
import { notDeleted, prisma, type TransactionClient } from '@olshop/db';

export class ProductVariantRepository {
  async findManyByProduct(userId: string, productId: string) {
    return prisma.productVariant.findMany({
      where: { userId, productId, ...notDeleted },
      orderBy: { createdAt: 'desc' },
      include: { inventory: true },
    });
  }

  async findManyByUser(userId: string) {
    return prisma.productVariant.findMany({
      where: { userId, ...notDeleted },
      orderBy: { createdAt: 'desc' },
      include: {
        product: { select: { id: true, name: true, slug: true, brand: true } },
        inventory: true,
      },
    });
  }

  async findByIdForUser(userId: string, variantId: string, tx?: TransactionClient) {
    const client = tx ?? prisma;
    return client.productVariant.findFirst({
      where: { id: variantId, userId, ...notDeleted },
      include: {
        product: true,
        inventory: true,
      },
    });
  }

  async findBySkuForUser(userId: string, sku: string) {
    return prisma.productVariant.findFirst({
      where: { userId, sku, ...notDeleted },
    });
  }

  async create(
    data: {
      productId: string;
      userId: string;
      sku: string;
      barcode?: string | null;
      name: string;
      price: number;
      cost?: number | null;
      weight?: number | null;
      dimensions?: Prisma.InputJsonValue | typeof Prisma.DbNull;
      isActive?: boolean;
    },
    tx: TransactionClient,
  ) {
    return tx.productVariant.create({
      data: {
        productId: data.productId,
        userId: data.userId,
        sku: data.sku,
        barcode: data.barcode ?? null,
        name: data.name,
        price: data.price,
        cost: data.cost ?? null,
        weight: data.weight ?? null,
        dimensions: data.dimensions ?? undefined,
        isActive: data.isActive ?? true,
      },
    });
  }
}

export const productVariantRepository = new ProductVariantRepository();
