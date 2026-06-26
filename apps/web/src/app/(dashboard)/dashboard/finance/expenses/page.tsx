import type { Metadata } from 'next';

import { PageHeader } from '@/components/page-header';
import { requireOrgPermission } from '@/modules/auth/services/session';
import { ExpensesDashboard } from '@/modules/finance/components/expenses-dashboard';
import { ExpenseTemplatesPanel } from '@/modules/finance/components/expense-templates-panel';

export const metadata: Metadata = {
  title: 'Pengeluaran',
};

export default async function ExpensesPage() {
  await requireOrgPermission('finance.view');

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Keuangan"
        title="Pengeluaran"
        description="Biaya operasional (iklan, packaging, ongkir, gaji, dll.) yang dikurangkan dari laba kotor di laporan Laba bersih."
      />
      <ExpenseTemplatesPanel />
      <ExpensesDashboard />
    </div>
  );
}
