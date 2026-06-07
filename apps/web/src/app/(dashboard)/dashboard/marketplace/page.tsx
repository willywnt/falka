import type { Metadata } from 'next';

import { PageHeader } from '@/components/page-header';
import { MarketplaceDashboard } from '@/modules/marketplace/components/marketplace-dashboard';

export const metadata: Metadata = {
  title: 'Koneksi Marketplace',
};

export default function DashboardMarketplacePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Channel penjualan"
        title="Koneksi marketplace"
        description="Hubungkan toko Shopee dan Tokopedia kamu. Data login disimpan terenkripsi."
      />
      <MarketplaceDashboard />
    </div>
  );
}
