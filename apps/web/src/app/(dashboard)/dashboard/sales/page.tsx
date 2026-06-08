import type { Metadata } from 'next';

import { PageHeader } from '@/components/page-header';
import { SalesDashboard } from '@/modules/sales/components/sales-dashboard';

export const metadata: Metadata = {
  title: 'Penjualan',
};

export default function SalesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Channel penjualan"
        title="Penjualan (Kasir)"
        description="Jualan langsung di toko, pakai stok yang sama dengan marketplace kamu — jadi nggak bakal kejual dobel."
      />
      <SalesDashboard />
    </div>
  );
}
