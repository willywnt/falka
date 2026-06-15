import 'server-only';

import { prisma } from '@falka/db';
import { StockLedgerReason } from '@prisma/client';

import type {
  AbcReport,
  ChannelPerformanceReport,
  DeadStockReport,
  InventoryValuationReport,
  ProfitBySku,
  ProfitChannel,
  ProfitReport,
} from '../types';
import type { DeadStockQuery } from '../validators/dead-stock';
import type { ProfitReportQuery } from '../validators/profit-report';
import { aggregateAbc } from '../utils/abc-aggregate';
import {
  aggregateChannelPerformance,
  type TransactionsByChannel,
} from '../utils/channel-performance-aggregate';
import { aggregateDeadStock, type DeadStockVariant } from '../utils/dead-stock-aggregate';
import { aggregateFulfillment, type FulfillmentInput } from '../utils/fulfillment';
import {
  aggregateInventoryValuation,
  type ValuationVariant,
} from '../utils/inventory-valuation-aggregate';
import { computePaymentMix, type PaymentMixInput } from '../utils/payment-mix';
import { aggregateProfit, aggregateProfitBySku, type SoldLine } from '../utils/profit-aggregate';

const DEFAULT_RANGE_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Outbound-demand ledger reasons that count as a real sale for "last sold":
 * SALE (offline/POS) and ORDER_RESERVE (a paid marketplace order). RETURN /
 * ORDER_RELEASE are inbound reversals and ORDER_SHIP carries a delta of 0, so
 * none of them mark a fresh sale.
 */
const SOLD_LEDGER_REASONS = [StockLedgerReason.SALE, StockLedgerReason.ORDER_RESERVE] as const;

/** Whole days between two instants, floored and never negative. */
function daysBetween(earlier: Date, later: Date): number {
  return Math.max(0, Math.floor((later.getTime() - earlier.getTime()) / DAY_MS));
}

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
 * (SHIPPED/COMPLETED); COGS comes from each line's snapshotted unitCost. A
 * processed return (RECEIVED) on a still-shipped/completed order nets its lines
 * back out — recognized when the goods return (`processedAt`), as negative-qty
 * lines — so a returned order no longer overstates profit. Never writes — it
 * only reads SaleItem/OrderItem/Return history.
 */
export class ReportingServerService {
  private async loadSoldLines(
    organizationId: string,
    query: ProfitReportQuery,
  ): Promise<{ lines: SoldLine[]; from: Date; to: Date }> {
    const to = endOfDay(query.to ?? new Date());
    const from = startOfDay(query.from ?? new Date(to.getTime() - DEFAULT_RANGE_DAYS * DAY_MS));

    const [saleItems, saleRefundItems, orderItems, returns] = await Promise.all([
      prisma.saleItem.findMany({
        where: {
          sale: {
            organizationId,
            status: { in: ['COMPLETED', 'PARTIALLY_REFUNDED'] },
            createdAt: { gte: from, lte: to },
          },
        },
        select: {
          quantity: true,
          unitPrice: true,
          unitCost: true,
          discountAmount: true,
          sku: true,
          name: true,
          productVariantId: true,
          sale: { select: { createdAt: true, taxRate: true, taxInclusive: true } },
        },
      }),
      // POS refunds net their sale back out (recognized when the refund was
      // made), valued at the SAME effective net unit as the sale line above.
      prisma.saleRefundItem.findMany({
        where: {
          refund: {
            organizationId,
            createdAt: { gte: from, lte: to },
            sale: { status: { in: ['COMPLETED', 'PARTIALLY_REFUNDED'] } },
          },
        },
        select: {
          quantity: true,
          sku: true,
          name: true,
          productVariantId: true,
          saleItem: {
            select: {
              quantity: true,
              unitPrice: true,
              unitCost: true,
              discountAmount: true,
            },
          },
          refund: {
            select: {
              createdAt: true,
              sale: { select: { taxRate: true, taxInclusive: true } },
            },
          },
        },
      }),
      prisma.orderItem.findMany({
        where: {
          productVariantId: { not: null },
          order: {
            organizationId,
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
      // Processed returns whose order still counts as revenue above. A post-ship
      // cancellation (order status CANCELLED) is already excluded from revenue, so
      // netting it here would double-subtract — gate on SHIPPED/COMPLETED. Recognized
      // by processedAt (when the goods actually came back).
      prisma.return.findMany({
        where: {
          organizationId,
          status: 'RECEIVED',
          processedAt: { gte: from, lte: to },
          order: { status: { in: ['SHIPPED', 'COMPLETED'] } },
        },
        select: {
          processedAt: true,
          items: { select: { orderItemId: true, productVariantId: true, quantity: true } },
          order: {
            select: {
              provider: true,
              items: {
                select: {
                  id: true,
                  unitPrice: true,
                  unitCost: true,
                  externalSku: true,
                  externalName: true,
                  productVariant: { select: { sku: true, name: true } },
                },
              },
            },
          },
        },
      }),
    ]);

    const lines: SoldLine[] = [
      // POS revenue is NET: line gross minus its allocated cart discount, and
      // with the contained PPN carved out when the sale was tax-inclusive
      // (exclusive PPN never sat in unitPrice, so no scaling there). The
      // effective unit price keeps every downstream aggregate (omzet, margin,
      // rankings, below-cost) on net numbers without touching their math.
      ...saleItems.map((item) => {
        const gross = Number(item.unitPrice) * item.quantity;
        const afterDiscount = Math.max(0, gross - Number(item.discountAmount));
        const taxRate = Number(item.sale.taxRate);
        const net =
          item.sale.taxInclusive && taxRate > 0
            ? afterDiscount * (100 / (100 + taxRate))
            : afterDiscount;

        return {
          date: item.sale.createdAt,
          channel: 'POS' as ProfitChannel,
          variantId: item.productVariantId,
          sku: item.sku,
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.quantity > 0 ? net / item.quantity : 0,
          unitCost: item.unitCost == null ? null : Number(item.unitCost),
        };
      }),
      // Negative-qty lines reversing refunded units at the same net unit value
      // (revenue AND COGS come back out, mirroring the marketplace-return path).
      ...saleRefundItems.map((item) => {
        const saleLine = item.saleItem;
        const gross = Number(saleLine.unitPrice) * saleLine.quantity;
        const afterDiscount = Math.max(0, gross - Number(saleLine.discountAmount));
        const taxRate = Number(item.refund.sale.taxRate);
        const net =
          item.refund.sale.taxInclusive && taxRate > 0
            ? afterDiscount * (100 / (100 + taxRate))
            : afterDiscount;

        return {
          date: item.refund.createdAt,
          channel: 'POS' as ProfitChannel,
          variantId: item.productVariantId,
          sku: item.sku,
          name: item.name,
          quantity: -item.quantity,
          unitPrice: saleLine.quantity > 0 ? net / saleLine.quantity : 0,
          unitCost: saleLine.unitCost == null ? null : Number(saleLine.unitCost),
        };
      }),
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

    // Net each processed return back out, valued at the original order line's
    // snapshotted price/cost, as a negative-qty line (reverses both revenue + COGS).
    for (const ret of returns) {
      if (!ret.processedAt) continue;
      const orderItemsById = new Map(ret.order.items.map((item) => [item.id, item]));
      for (const item of ret.items) {
        if (!item.productVariantId) continue;
        const orderItem = orderItemsById.get(item.orderItemId);
        if (!orderItem) continue;
        lines.push({
          date: ret.processedAt,
          channel: ret.order.provider as ProfitChannel,
          variantId: item.productVariantId,
          sku: orderItem.productVariant?.sku ?? orderItem.externalSku ?? '—',
          name: orderItem.productVariant?.name ?? orderItem.externalName,
          quantity: -item.quantity,
          unitPrice: orderItem.unitPrice == null ? 0 : Number(orderItem.unitPrice),
          unitCost: orderItem.unitCost == null ? null : Number(orderItem.unitCost),
        });
      }
    }

    return { lines, from, to };
  }

  async getProfitReport(organizationId: string, query: ProfitReportQuery): Promise<ProfitReport> {
    const { lines, from, to } = await this.loadSoldLines(organizationId, query);
    return aggregateProfit(lines, { from, to, groupBy: query.groupBy });
  }

  /** Full per-SKU profit rows for the CSV export (no top/bottom slicing). */
  async getProfitSkuRows(organizationId: string, query: ProfitReportQuery): Promise<ProfitBySku[]> {
    const { lines } = await this.loadSoldLines(organizationId, query);
    return aggregateProfitBySku(lines);
  }

  /**
   * Count realized transactions per channel over the SAME range + recognition as
   * the sold lines: one per COMPLETED POS sale, one per SHIPPED/COMPLETED order
   * (grouped by provider). Drives average-order-value (a SoldLine is per-item).
   */
  private async loadTransactionCounts(
    organizationId: string,
    from: Date,
    to: Date,
  ): Promise<TransactionsByChannel> {
    const [posCount, ordersByProvider] = await Promise.all([
      prisma.sale.count({
        where: { organizationId, status: 'COMPLETED', createdAt: { gte: from, lte: to } },
      }),
      prisma.order.groupBy({
        by: ['provider'],
        where: {
          organizationId,
          status: { in: ['SHIPPED', 'COMPLETED'] },
          placedAt: { gte: from, lte: to },
        },
        _count: { _all: true },
      }),
    ]);

    const transactions: TransactionsByChannel = {};
    if (posCount > 0) transactions.POS = posCount;
    for (const row of ordersByProvider) {
      transactions[row.provider as ProfitChannel] = row._count._all;
    }
    return transactions;
  }

  /**
   * POS payment-method mix over the range: gross total received per tender across
   * realized counter sales (COMPLETED / PARTIALLY_REFUNDED). Gross `totalAmount`
   * so it reconciles to the till / QRIS settlement — a payment view, not net-of-tax.
   */
  private async loadPosPaymentMix(
    organizationId: string,
    from: Date,
    to: Date,
  ): Promise<PaymentMixInput[]> {
    const rows = await prisma.sale.groupBy({
      by: ['paymentMethod'],
      where: {
        organizationId,
        status: { in: ['COMPLETED', 'PARTIALLY_REFUNDED'] },
        createdAt: { gte: from, lte: to },
      },
      _sum: { totalAmount: true },
      _count: { _all: true },
    });

    return rows.map((row) => ({
      method: row.paymentMethod,
      amount: Number(row._sum.totalAmount ?? 0),
      salesCount: row._count._all,
    }));
  }

  /**
   * Per-channel time-to-ship: shipped/completed marketplace orders placed in the
   * range that carry a ship timestamp, as (channel, placedAt → inventoryShippedAt)
   * pairs for the fulfillment aggregate. POS sales have no fulfillment leg.
   */
  private async loadFulfillment(
    organizationId: string,
    from: Date,
    to: Date,
  ): Promise<FulfillmentInput[]> {
    const orders = await prisma.order.findMany({
      where: {
        organizationId,
        status: { in: ['SHIPPED', 'COMPLETED'] },
        placedAt: { gte: from, lte: to },
        inventoryShippedAt: { not: null },
      },
      select: { provider: true, placedAt: true, inventoryShippedAt: true },
    });

    return orders.flatMap((order) =>
      order.inventoryShippedAt
        ? [
            {
              channel: order.provider as ProfitChannel,
              placedAt: order.placedAt,
              shippedAt: order.inventoryShippedAt,
            },
          ]
        : [],
    );
  }

  /**
   * Per-channel performance: the profit metrics per channel plus revenue share,
   * transactions + average order value, refunds/return rate, and a channel ×
   * period revenue trend. Same realized-sales basis as the profit report.
   */
  async getChannelPerformance(
    organizationId: string,
    query: ProfitReportQuery,
  ): Promise<ChannelPerformanceReport> {
    const { lines, from, to } = await this.loadSoldLines(organizationId, query);
    const [transactions, paymentRows, fulfillmentRows] = await Promise.all([
      this.loadTransactionCounts(organizationId, from, to),
      this.loadPosPaymentMix(organizationId, from, to),
      this.loadFulfillment(organizationId, from, to),
    ]);
    return aggregateChannelPerformance(lines, transactions, {
      from,
      to,
      groupBy: query.groupBy,
      paymentMix: computePaymentMix(paymentRows),
      fulfillment: aggregateFulfillment(fulfillmentRows),
    });
  }

  /**
   * Current inventory valuation: every live variant's on-hand stock valued at its
   * moving-average cost (same formula as the dashboard's totalStockValue), rolled
   * up per product. A snapshot — no date range.
   */
  async getInventoryValuation(organizationId: string): Promise<InventoryValuationReport> {
    const variants = await prisma.productVariant.findMany({
      where: { organizationId, deletedAt: null },
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

  /**
   * Dead-stock scan: every live variant still holding stock, with its days since
   * the last sale (the most recent SALE/ORDER_RESERVE ledger row). The aggregate
   * keeps only those idle past `staleDays` and values the stuck capital at the
   * moving-average cost. A snapshot — no date range.
   */
  async getDeadStock(organizationId: string, query: DeadStockQuery): Promise<DeadStockReport> {
    const now = new Date();

    const [variants, lastSoldRows] = await Promise.all([
      prisma.productVariant.findMany({
        where: { organizationId, deletedAt: null },
        select: {
          id: true,
          productId: true,
          name: true,
          sku: true,
          variantGroup: true,
          cost: true,
          createdAt: true,
          product: { select: { name: true } },
          inventory: { select: { availableStock: true } },
        },
      }),
      // Last genuine outbound sale per variant (most recent SALE/ORDER_RESERVE
      // ledger row), scoped to the org.
      prisma.stockLedger.groupBy({
        by: ['variantId'],
        where: { organizationId, reason: { in: [...SOLD_LEDGER_REASONS] } },
        _max: { createdAt: true },
      }),
    ]);

    const lastSoldByVariant = new Map(
      lastSoldRows.map((row) => [row.variantId, row._max.createdAt]),
    );

    const rows: DeadStockVariant[] = variants.map((variant) => {
      const lastSoldAt = lastSoldByVariant.get(variant.id) ?? null;
      return {
        variantId: variant.id,
        productId: variant.productId,
        productName: variant.product.name,
        variantName: variant.name,
        variantGroup: variant.variantGroup,
        sku: variant.sku,
        available: variant.inventory?.availableStock ?? 0,
        cost: variant.cost == null ? null : Number(variant.cost),
        daysSinceLastSale: lastSoldAt ? daysBetween(lastSoldAt, now) : null,
        ageDays: daysBetween(variant.createdAt, now),
      };
    });

    return aggregateDeadStock(rows, { staleDays: query.staleDays });
  }

  /**
   * ABC analysis: rank SKUs by their share of net revenue over the range and
   * bucket them A/B/C (Pareto). Reuses the profit report's realized-sale lines,
   * so processed returns net each SKU down — same recognition + range handling.
   */
  async getAbcAnalysis(organizationId: string, query: ProfitReportQuery): Promise<AbcReport> {
    const { lines, from, to } = await this.loadSoldLines(organizationId, query);
    return aggregateAbc(lines, { from, to });
  }
}

export const reportingServerService = new ReportingServerService();
