import type { Metadata } from 'next';

import { PageHeader } from '@/components/page-header';
import { StockActivity } from '@/modules/inventory/components/stock-activity';

export const metadata: Metadata = {
  title: 'Stock activity',
};

export default function StockActivityPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Stock activity"
        description="Every stock change, newest first — filter and export the full ledger history."
      />
      <StockActivity />
    </div>
  );
}
