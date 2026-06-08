import type { Metadata } from 'next';
import { Suspense } from 'react';

import { PageHeader } from '@/components/page-header';
import { ReportsInsights } from '@/modules/reporting/components/reports-insights';

export const metadata: Metadata = {
  title: 'Laba & channel',
};

export default function ProfitReportPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Insight"
        title="Laba & channel"
        description="Omzet, HPP, margin, dan perbandingan tiap channel — lihat dari mana untung kamu datang."
      />
      <Suspense fallback={null}>
        <ReportsInsights />
      </Suspense>
    </div>
  );
}
