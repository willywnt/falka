import type { Metadata } from 'next';

import { PageHeader } from '@/components/page-header';
import { requireOrgPermission } from '@/modules/auth/services/session';
import { PurchasingDashboard } from '@/modules/purchasing/components/purchasing-dashboard';

export const metadata: Metadata = {
  title: 'Pembelian',
};

export default async function PurchasingPage() {
  await requireOrgPermission('purchasing.view');

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Stok"
        title="Pembelian"
        description="Restok dari supplier. Barang yang dipesan masuk hitungan stok akan datang, lalu jadi tersedia begitu kamu terima."
      />
      <PurchasingDashboard />
    </div>
  );
}
