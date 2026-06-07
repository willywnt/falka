import 'server-only';

import { prisma } from '@olshop/db';

import type { InventoryValuationReport, ProfitBySku, ProfitChannel, ProfitReport } from '../types';
import type { ProfitReportQuery } from '../validators/profit-report';
import {
  aggregateInventoryValuation,
  type ValuationVariant,
} from '../utils/inventory-valuation-aggregate';
import { aggregateProfit, aggregateProfitBySku, type SoldLine } from '../utils/profit-aggregate';

const DEFAULT_RANGE_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function endOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
}

/**
 * Read-only profit/margin reporting over realized sales. Revenue is recognized
 * for POS sales that are COMPLETED and for marketplace orders that have shipped
 * (SHIPPED/COMPLETED); COGS comes from each line's snapshotted unitCost. Never
 * writes — it only reads SaleItem/OrderItem history.
 */
export class ReportingServerService {
  private async loadSoldLines(
    userId: string,
    query: ProfitReportQuery,
  ): Promise<{ lines: SoldLine[]; from: Date; to: Date }> {
    const to = endOfDay(query.to ?? new Date());
    const from = startOfDay(query.from ?? new Date(to.getTime() - DEFAULT_RANGE_DAYS * DAY_MS));

    const [saleItems, orderItems] = await Promise.all([
      prisma.saleItem.findMany({
        where: { sale: { userId, status: 'COMPLETED', createdAt: { gte: from, lte: to } } },
        select: {
          quantity: true,
          unitPrice: true,
          unitCost: true,
          sku: true,
          name: true,
          productVariantId: true,
          sale: { select: { createdAt: true } },
        },
      }),
      prisma.orderItem.findMany({
        where: {
          productVariantId: { not: null },
          order: {
            userId,
            status: { in: ['SHIPPED', 'COMPLETED'] },
            placedAt: { gte: from, lte: to },
          },
        },
        select: {
          quantity: true,
          unitPrice: true,
          unitCost: true,
          externalSku: true,
          externalName: true,
          productVariantId: true,
          productVariant: { select: { sku: true, name: true } },
          order: { select: { placedAt: true, provider: true } },
        },
      }),
    ]);

    const lines: SoldLine[] = [
      ...saleItems.map((item) => ({
        date: item.sale.createdAt,
        channel: 'POS' as ProfitChannel,
        variantId: item.productVariantId,
        sku: item.sku,
        name: item.name,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        unitCost: item.unitCost == null ? null : Number(item.unitCost),
      })),
      ...orderItems.map((item) => ({
        date: item.order.placedAt,
        channel: item.order.provider as ProfitChannel,
        variantId: item.productVariantId,
        sku: item.productVariant?.sku ?? item.externalSku ?? '—',
        name: item.productVariant?.name ?? item.externalName,
        quantity: item.quantity,
        unitPrice: item.unitPrice == null ? 0 : Number(item.unitPrice),
        unitCost: item.unitCost == null ? null : Number(item.unitCost),
      })),
    ];

    return { lines, from, to };
  }

  async getProfitReport(userId: string, query: ProfitReportQuery): Promise<ProfitReport> {
    const { lines, from, to } = await this.loadSoldLines(userId, query);
    return aggregateProfit(lines, { from, to, groupBy: query.groupBy });
  }

  /** Full per-SKU profit rows for the CSV export (no top/bottom slicing). */
  async getProfitSkuRows(userId: string, query: ProfitReportQuery): Promise<ProfitBySku[]> {
    const { lines } = await this.loadSoldLines(userId, query);
    return aggregateProfitBySku(lines);
  }

  /**
   * Current inventory valuation: every live variant's on-hand stock valued at its
   * moving-average cost (same formula as the dashboard's totalStockValue), rolled
   * up per product. A snapshot — no date range.
   */
  async getInventoryValuation(userId: string): Promise<InventoryValuationReport> {
    const variants = await prisma.productVariant.findMany({
      where: { userId, deletedAt: null },
      select: {
        productId: true,
        cost: true,
        product: { select: { name: true, category: true } },
        inventory: { select: { availableStock: true } },
      },
    });

    const lines: ValuationVariant[] = variants.map((variant) => ({
      productId: variant.productId,
      productName: variant.product.name,
      category: variant.product.category,
      available: variant.inventory?.availableStock ?? 0,
      cost: variant.cost == null ? null : Number(variant.cost),
    }));

    return aggregateInventoryValuation(lines);
  }
}

export const reportingServerService = new ReportingServerService();
