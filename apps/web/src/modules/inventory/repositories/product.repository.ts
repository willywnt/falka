import 'server-only';

import { notDeleted, prisma, type TransactionClient } from '@olshop/db';

export class ProductRepository {
  async findManyByUser(userId: string) {
    return prisma.product.findMany({
      where: { userId, ...notDeleted },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { variants: { where: notDeleted } } },
      },
    });
  }

  async findByIdForUser(userId: string, productId: string) {
    return prisma.product.findFirst({
      where: { id: productId, userId, ...notDeleted },
    });
  }

  async findSlugsByUser(userId: string, tx?: TransactionClient) {
    const client = tx ?? prisma;
    const products = await client.product.findMany({
      where: { userId, ...notDeleted },
      select: { slug: true },
    });
    return products.map((product) => product.slug);
  }

  async create(
    data: {
      userId: string;
      name: string;
      slug: string;
      brand?: string | null;
      description?: string | null;
      isActive?: boolean;
    },
    tx?: TransactionClient,
  ) {
    const client = tx ?? prisma;
    return client.product.create({ data });
  }
}

export const productRepository = new ProductRepository();
