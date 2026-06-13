import type { Metadata } from 'next';

import { PageHeader } from '@/components/page-header';
import { requireOrgPermission } from '@/modules/auth/services/session';
import { MarketplaceDashboard } from '@/modules/marketplace/components/marketplace-dashboard';

export const metadata: Metadata = {
  title: 'Koneksi Marketplace',
};

export default async function DashboardMarketplacePage() {
  await requireOrgPermission('marketplace.view');

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Jualan"
        title="Koneksi marketplace"
        description="Hubungkan toko Shopee dan Tokopedia kamu. Data login disimpan terenkripsi."
      />
      <MarketplaceDashboard />
    </div>
  );
}
