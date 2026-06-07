import type { Metadata } from 'next';

import { PageHeader } from '@/components/page-header';
import { PurchasingDashboard } from '@/modules/purchasing/components/purchasing-dashboard';

export const metadata: Metadata = {
  title: 'Pembelian',
};

export default function PurchasingPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Katalog"
        title="Pembelian"
        description="Restok dari supplier. Barang yang dipesan masuk hitungan stok akan datang, lalu jadi tersedia begitu kamu terima."
      />
      <PurchasingDashboard />
    </div>
  );
}
