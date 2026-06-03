import 'server-only';

import { prisma } from '@olshop/db';
import { enqueuePropagateInventoryStock } from '@olshop/queue';
import type { Prisma } from '@prisma/client';

import { appLogger } from '@/lib/logger';
import { inventoryServerService } from '@/modules/inventory/services/inventory-server.service';

import { getMarketplaceOrderAdapter } from '../adapters/order-adapter';
import { OrderError } from '../errors/order-errors';
import type { OrderDetail, OrderItemDetail, OrderListItem, PullOrdersResult } from '../types';

export class OrdersServerService {
  async listOrders(userId: string): Promise<OrderListItem[]> {
    const orders = await prisma.order.findMany({
      where: { userId },
      include: {
        connection: { select: { shopName: true } },
        items: { select: { productVariantId: true } },
      },
      orderBy: { placedAt: 'desc' },
      take: 100,
    });

    return orders.map((order) => ({
      id: order.id,
      externalOrderId: order.externalOrderId,
      provider: order.provider,
      shopName: order.connection.shopName,
      status: order.status,
      buyerName: order.buyerName,
      noResi: order.noResi,
      totalAmount: order.totalAmount?.toString() ?? null,
      currency: order.currency,
      itemCount: order.items.length,
      unresolvedCount: order.items.filter((item) => item.productVariantId === null).length,
      inventoryApplied: order.inventoryAppliedAt !== null,
      placedAt: order.placedAt.toISOString(),
    }));
  }

  async getOrder(userId: string, orderId: string): Promise<OrderDetail> {
    const order = await prisma.order.findFirst({
      where: { id: orderId, userId },
      include: {
        connection: { select: { shopName: true } },
        items: {
          orderBy: { createdAt: 'asc' },
          include: {
            productVariant: {
              select: { id: true, sku: true, name: true, product: { select: { name: true } } },
            },
          },
        },
      },
    });
    if (!order) throw OrderError.notFound();

    const items: OrderItemDetail[] = order.items.map((item) => ({
      id: item.id,
      externalName: item.externalName,
      externalSku: item.externalSku,
      quantity: item.quantity,
      unitPrice: item.unitPrice?.toString() ?? null,
      resolved: item.productVariantId !== null,
      variant: item.productVariant
        ? {
            id: item.productVariant.id,
            sku: item.productVariant.sku,
            name: item.productVariant.name,
            productName: item.productVariant.product.name,
          }
        : null,
    }));

    return {
      id: order.id,
      externalOrderId: order.externalOrderId,
      provider: order.provider,
      shopName: order.connection.shopName,
      status: order.status,
      buyerName: order.buyerName,
      noResi: order.noResi,
      totalAmount: order.totalAmount?.toString() ?? null,
      currency: order.currency,
      itemCount: items.length,
      unresolvedCount: items.filter((item) => !item.resolved).length,
      inventoryApplied: order.inventoryAppliedAt !== null,
      placedAt: order.placedAt.toISOString(),
      items,
    };
  }

  async pullOrders(userId: string, connectionId: string): Promise<PullOrdersResult> {
    const connection = await prisma.marketplaceConnection.findFirst({
      where: { id: connectionId, userId, deletedAt: null },
    });
    if (!connection) throw OrderError.notFound('Marketplace connection not found.');
    if (!connection.isActive) throw OrderError.validation('Marketplace connection is not active.');

    const adapter = getMarketplaceOrderAdapter(connection.provider);
    const orders = await adapter.fetchOrders({ shopId: connection.shopId, accessToken: '' });

    let pulled = 0;
    let applied = 0;
    const affectedVariantIds = new Set<string>();

    for (const order of orders) {
      const resolvedItems = await Promise.all(
        order.items.map(async (item) => {
          const listing = await prisma.marketplaceProduct.findUnique({
            where: {
              marketplaceConnectionId_externalProductId_externalVariantId: {
                marketplaceConnectionId: connection.id,
                externalProductId: item.externalProductId,
                externalVariantId: item.externalVariantId,
              },
            },
            select: { mapping: { select: { productVariantId: true } } },
          });
          return { ...item, productVariantId: listing?.mapping?.productVariantId ?? null };
        }),
      );

      const saved = await prisma.$transaction(async (tx) => {
        const upserted = await tx.order.upsert({
          where: {
            marketplaceConnectionId_externalOrderId: {
              marketplaceConnectionId: connection.id,
              externalOrderId: order.externalOrderId,
            },
          },
          create: {
            userId,
            marketplaceConnectionId: connection.id,
            provider: connection.provider,
            externalOrderId: order.externalOrderId,
            status: order.status,
            noResi: order.noResi,
            buyerName: order.buyerName,
            totalAmount: order.totalAmount,
            currency: order.currency,
            rawPayload: order.raw as Prisma.InputJsonValue,
            placedAt: order.placedAt,
          },
          update: {
            status: order.status,
            noResi: order.noResi,
            buyerName: order.buyerName,
            totalAmount: order.totalAmount,
            currency: order.currency,
            rawPayload: order.raw as Prisma.InputJsonValue,
            placedAt: order.placedAt,
          },
        });

        await tx.orderItem.deleteMany({ where: { orderId: upserted.id } });
        await tx.orderItem.createMany({
          data: resolvedItems.map((item) => ({
            orderId: upserted.id,
            externalProductId: item.externalProductId,
            externalVariantId: item.externalVariantId,
            externalSku: item.externalSku,
            externalName: item.externalName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            productVariantId: item.productVariantId,
          })),
        });

        return upserted;
      });
      pulled += 1;

      const shouldApply =
        saved.status === 'PAID' &&
        saved.inventoryAppliedAt === null &&
        resolvedItems.some((item) => item.productVariantId !== null);

      if (shouldApply) {
        await prisma.$transaction(async (tx) => {
          for (const item of resolvedItems) {
            if (!item.productVariantId) continue;
            await inventoryServerService.applyOrderDecrementTx(tx, {
              userId,
              variantId: item.productVariantId,
              quantity: item.quantity,
              orderId: saved.id,
            });
            affectedVariantIds.add(item.productVariantId);
          }
          await tx.order.update({
            where: { id: saved.id },
            data: { inventoryAppliedAt: new Date() },
          });
        });
        applied += 1;
      }
    }

    await this.propagateAffected(userId, affectedVariantIds, connection.id);

    appLogger.info('orders.pulled', { userId, connectionId: connection.id, pulled, applied });
    return { pulled, applied };
  }

  /** Best-effort: push each decremented variant's new available stock to its other channels. */
  private async propagateAffected(
    userId: string,
    variantIds: Set<string>,
    connectionId: string,
  ): Promise<void> {
    for (const variantId of variantIds) {
      try {
        const inventory = await prisma.inventory.findUnique({
          where: { variantId },
          select: { availableStock: true },
        });
        await enqueuePropagateInventoryStock({
          userId,
          variantId,
          availableStock: inventory?.availableStock ?? 0,
          eventId: `order-${connectionId}-${variantId}-${Date.now()}`,
        });
      } catch (error) {
        appLogger.warn('orders.propagate.enqueue_failed', {
          userId,
          variantId,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }
}

export const ordersServerService = new OrdersServerService();
