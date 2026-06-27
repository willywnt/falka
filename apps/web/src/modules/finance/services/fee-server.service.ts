import 'server-only';

import { prisma } from '@falka/db';
import { Prisma, type ExpenseCategory } from '@prisma/client';

import { appLogger } from '@/lib/logger';
import { auditService } from '@/modules/audit/services/audit.service';
import { marketplaceServerService } from '@/modules/marketplace/services/marketplace-server.service';
import { ordersServerService } from '@/modules/orders/services/orders-server.service';
import { salesServerService } from '@/modules/sales/services/sales-server.service';

import type { DeriveFeesResult, FeeConfig } from '../types';
import type { UpdateFeeConfigInput } from '../validators/fee-config';

/** Round to 2 decimals (rupiah cents) without float drift. */
function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function isUniqueViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}

function monthBounds(month: string): { year: number; monthNumber: number; from: Date; to: Date } {
  const year = Number(month.slice(0, 4));
  const monthNumber = Number(month.slice(5, 7)); // 1..12
  const lastDay = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  return {
    year,
    monthNumber,
    from: new Date(Date.UTC(year, monthNumber - 1, 1, 0, 0, 0, 0)),
    to: new Date(Date.UTC(year, monthNumber - 1, lastDay, 23, 59, 59, 999)),
  };
}

/**
 * Auto-derived FEE estimates (NOT actual marketplace-reported fees — our adapters don't receive
 * them). From configurable percent rates: a QRIS payment fee (org-level, % of gross QRIS sales)
 * and per-connection marketplace commission (% of fulfilled order revenue), materialized monthly
 * as `Expense` rows (categories PAYMENT_FEE / MARKETPLACE_COMMISSION) via "Hitung fee bulan ini".
 * Idempotent: each fee UPSERTs by `autoSourceKey` (one live row per key), so re-running refreshes
 * the month-to-date estimate instead of duplicating; a zero fee soft-deletes a stale row.
 */
export class FeeServerService {
  /** The QRIS rate (org) + each connection's commission rate — for the fee-config UI. */
  async getFeeConfig(organizationId: string): Promise<FeeConfig> {
    const [org, connections] = await Promise.all([
      prisma.organization.findUnique({
        where: { id: organizationId },
        select: { qrisFeeRate: true },
      }),
      marketplaceServerService.listConnections(organizationId),
    ]);

    return {
      qrisFeeRate: (org?.qrisFeeRate ?? 0).toString(),
      connections: connections.map((connection) => ({
        connectionId: connection.id,
        shopName: connection.shopName,
        provider: connection.provider,
        commissionRate: connection.commissionRate,
      })),
    };
  }

  /** Update the QRIS rate (org) + connection commission rates (via the marketplace service boundary). */
  async updateFeeConfig(
    organizationId: string,
    actorUserId: string,
    input: UpdateFeeConfigInput,
  ): Promise<FeeConfig> {
    if (input.qrisFeeRate !== undefined) {
      await prisma.organization.update({
        where: { id: organizationId },
        data: { qrisFeeRate: input.qrisFeeRate },
      });
      void auditService.log({
        organizationId,
        actorUserId,
        action: 'finance.qris_fee_rate_updated',
        resource: 'organization',
        resourceId: organizationId,
        metadata: { qrisFeeRate: String(input.qrisFeeRate) },
      });
    }

    for (const rate of input.connectionRates ?? []) {
      await marketplaceServerService.updateCommissionRate(
        organizationId,
        actorUserId,
        rate.connectionId,
        rate.commissionRate,
      );
    }

    return this.getFeeConfig(organizationId);
  }

  /**
   * Materialize a month's fee estimates from the configured rates. Idempotent per fee source.
   * `month` is "YYYY-MM".
   */
  async deriveFeesForMonth(
    organizationId: string,
    actorUserId: string,
    month: string,
  ): Promise<DeriveFeesResult> {
    const { year, monthNumber, from, to } = monthBounds(month);
    // Expense date = last day of the month, but never in the future (so the current month lands today).
    const now = new Date();
    const lastInstant = new Date(
      Date.UTC(year, monthNumber - 1, new Date(Date.UTC(year, monthNumber, 0)).getUTCDate()),
    );
    const date = lastInstant > now ? now : lastInstant;
    const monthLabel = new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(
      from,
    );

    let totalFee = 0;

    // QRIS payment fee.
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { qrisFeeRate: true },
    });
    const qrisRate = Number(org?.qrisFeeRate ?? 0);
    const qrisBase = await salesServerService.sumQrisAmountForMonth(organizationId, from, to);
    const qrisFee = round2((qrisBase * qrisRate) / 100);
    await this.upsertDerivedFee(organizationId, actorUserId, {
      autoSourceKey: `qris-fee:${month}`,
      category: 'PAYMENT_FEE',
      amount: qrisFee,
      date,
      periodMonth: month,
      note: `Estimasi fee QRIS ${monthLabel}`,
    });
    totalFee += qrisFee;

    // Marketplace commission, per connection with a rate set.
    const [connectionRevenues, connections] = await Promise.all([
      ordersServerService.sumRevenueByConnectionForMonth(organizationId, from, to),
      marketplaceServerService.listConnections(organizationId),
    ]);
    const revenueByConnection = new Map(
      connectionRevenues.map((row) => [row.connectionId, row.revenue]),
    );

    const commissions: DeriveFeesResult['commissions'] = [];
    for (const connection of connections) {
      const rate = Number(connection.commissionRate);
      const base = rate > 0 ? (revenueByConnection.get(connection.id) ?? 0) : 0;
      const fee = round2((base * rate) / 100);
      // ALWAYS upsert (even fee 0) so turning a rate off / losing the month's orders soft-deletes a
      // stale row — never leave an orphaned commission inflating opex.
      await this.upsertDerivedFee(organizationId, actorUserId, {
        autoSourceKey: `mp-commission:${connection.id}:${month}`,
        category: 'MARKETPLACE_COMMISSION',
        amount: fee,
        date,
        periodMonth: month,
        note: `Komisi ${connection.shopName} ${monthLabel}`,
      });
      if (fee > 0) {
        totalFee += fee;
        commissions.push({
          connectionId: connection.id,
          shopName: connection.shopName,
          base: base.toFixed(2),
          rate: rate.toFixed(2),
          fee: fee.toFixed(2),
        });
      }
    }

    appLogger.info('finance.fees.derived', { organizationId, month, totalFee });
    void auditService.log({
      organizationId,
      actorUserId,
      action: 'finance.fees_derived',
      resource: 'expense',
      metadata: { month, totalFee: totalFee.toFixed(2) },
    });

    return {
      month,
      qris: { base: qrisBase.toFixed(2), rate: qrisRate.toFixed(2), fee: qrisFee.toFixed(2) },
      commissions,
      totalFee: totalFee.toFixed(2),
    };
  }

  /**
   * Upsert one auto-derived fee expense keyed by `autoSourceKey`: update the live row if present,
   * else create it; a zero/negative amount soft-deletes a stale row (rate turned off / no sales).
   */
  private async upsertDerivedFee(
    organizationId: string,
    actorUserId: string,
    fee: {
      autoSourceKey: string;
      category: ExpenseCategory;
      amount: number;
      date: Date;
      periodMonth: string;
      note: string;
    },
  ): Promise<void> {
    const existing = await prisma.expense.findFirst({
      where: { organizationId, autoSourceKey: fee.autoSourceKey, deletedAt: null },
      select: { id: true },
    });

    if (fee.amount <= 0) {
      if (existing) {
        await prisma.expense.update({
          where: { id: existing.id },
          data: { deletedAt: new Date() },
        });
      }
      return;
    }

    const data = {
      category: fee.category,
      amount: fee.amount,
      date: fee.date,
      note: fee.note,
      periodMonth: fee.periodMonth,
    };

    if (existing) {
      await prisma.expense.update({ where: { id: existing.id }, data });
      return;
    }

    try {
      await prisma.expense.create({
        data: { userId: actorUserId, organizationId, autoSourceKey: fee.autoSourceKey, ...data },
      });
    } catch (error) {
      // A concurrent derive (another tab/device) won the create — the partial unique index rejects
      // this one (P2002). Converge: re-read the row it created and update it, instead of 500ing.
      if (!isUniqueViolation(error)) throw error;
      const raced = await prisma.expense.findFirst({
        where: { organizationId, autoSourceKey: fee.autoSourceKey, deletedAt: null },
        select: { id: true },
      });
      if (raced) await prisma.expense.update({ where: { id: raced.id }, data });
    }
  }
}

export const feeServerService = new FeeServerService();
