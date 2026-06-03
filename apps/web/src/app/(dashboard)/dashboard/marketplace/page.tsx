import type { Metadata } from 'next';

import { PageHeader } from '@/components/page-header';
import { MarketplaceDashboard } from '@/modules/marketplace/components/marketplace-dashboard';

export const metadata: Metadata = {
  title: 'Marketplace Connections',
};

export default function DashboardMarketplacePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Sales channels"
        title="Marketplace connections"
        description="Connect and manage Shopee and Tokopedia stores. Tokens are encrypted at rest."
      />
      <MarketplaceDashboard />
    </div>
  );
}
