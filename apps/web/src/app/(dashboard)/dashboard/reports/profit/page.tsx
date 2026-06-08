import type { Metadata } from 'next';
import { Suspense } from 'react';

import { PageHeader } from '@/components/page-header';
import { ProfitReport } from '@/modules/reporting/components/profit-report';

export const metadata: Metadata = {
  title: 'Laba & margin',
};

export default function ProfitReportPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Insight"
        title="Laba & margin"
        description="Omzet, HPP, dan margin kotor di semua channel — lihat SKU mana yang benar-benar menghasilkan."
      />
      <Suspense fallback={null}>
        <ProfitReport />
      </Suspense>
    </div>
  );
}
