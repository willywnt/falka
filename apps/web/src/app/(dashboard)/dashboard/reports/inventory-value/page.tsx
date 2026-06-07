import type { Metadata } from 'next';

import { PageHeader } from '@/components/page-header';
import { InventoryValuationReport } from '@/modules/reporting/components/inventory-valuation-report';

export const metadata: Metadata = {
  title: 'Stock value',
};

export default function InventoryValuationPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Insights"
        title="Stock value"
        description="What your on-hand inventory is worth at cost — see where your capital is tied up."
      />
      <InventoryValuationReport />
    </div>
  );
}
