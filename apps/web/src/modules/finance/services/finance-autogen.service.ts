import 'server-only';

import { prisma } from '@palka/db';
import { OrgRole } from '@prisma/client';

import { appLogger } from '@/lib/logger';

import { currentAndPreviousMonth } from '../utils/period';
import { expenseTemplateServerService } from './expense-template-server.service';
import { feeServerService } from './fee-server.service';

export interface FinanceAutogenResult {
  recurringMonth: string;
  feeMonth: string;
  orgsProcessed: number;
  orgsFailed: number;
  recurringCreated: number;
}

/**
 * Cross-org monthly finance auto-generation — run on the 1st by the custom server's timer
 * (server.ts → the secret-gated `/api/v1/internal/finance-generate` endpoint). For EVERY org it
 * materializes THIS month's recurring opex ({@link expenseTemplateServerService.generateForMonth})
 * and finalizes LAST month's auto-derived fees ({@link feeServerService.deriveFeesForMonth} — the
 * now-complete month). Both are idempotent (skipDuplicates / upsert-by-key), so re-running — or the
 * timer firing more than once on the 1st — is safe. The org OWNER is the audit actor + expense
 * creator (same identity the manual "Buat bulan ini" / "Hitung fee bulan ini" buttons record).
 */
export class FinanceAutogenService {
  async runMonthlyForAllOrgs(now: Date): Promise<FinanceAutogenResult> {
    const { current, previous } = currentAndPreviousMonth(now);

    const owners = await prisma.organizationMember.findMany({
      where: { role: OrgRole.OWNER },
      select: { organizationId: true, userId: true },
    });

    let orgsProcessed = 0;
    let orgsFailed = 0;
    let recurringCreated = 0;

    for (const { organizationId, userId } of owners) {
      try {
        const generated = await expenseTemplateServerService.generateForMonth(
          organizationId,
          userId,
          current,
        );
        await feeServerService.deriveFeesForMonth(organizationId, userId, previous);
        orgsProcessed += 1;
        recurringCreated += generated.created;
      } catch (error) {
        // One org's failure must not abort the rest — log and carry on.
        orgsFailed += 1;
        appLogger.warn('finance.autogen.org_failed', {
          organizationId,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    appLogger.info('finance.autogen.completed', {
      recurringMonth: current,
      feeMonth: previous,
      orgsProcessed,
      orgsFailed,
      recurringCreated,
    });

    return {
      recurringMonth: current,
      feeMonth: previous,
      orgsProcessed,
      orgsFailed,
      recurringCreated,
    };
  }
}

export const financeAutogenService = new FinanceAutogenService();
