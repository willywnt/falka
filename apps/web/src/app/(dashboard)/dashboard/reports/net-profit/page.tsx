import type { Metadata } from 'next';

import { PageHeader } from '@/components/page-header';
import { requireOrgPermission } from '@/modules/auth/services/session';
import { NetProfitReport } from '@/modules/reporting/components/net-profit-report';

export const metadata: Metadata = {
  title: 'Laba bersih',
};

export default async function NetProfitReportPage() {
  await requireOrgPermission('finance.view');

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Laporan"
        title="Laba bersih (Net P&L)"
        description="Laba kotor dikurangi biaya operasional — untung bisnis kamu yang sebenarnya."
      />
      <NetProfitReport />
    </div>
  );
}
