import type { Metadata } from 'next';

import { PageHeader } from '@/components/page-header';
import { ReturnsDashboard } from '@/modules/returns/components/returns-dashboard';

export const metadata: Metadata = {
  title: 'Returns',
};

export default function ReturnsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Fulfillment"
        title="Returns"
        description="Goods coming back. Receive a return to restock resellable units or write off damaged ones."
      />
      <ReturnsDashboard />
    </div>
  );
}
