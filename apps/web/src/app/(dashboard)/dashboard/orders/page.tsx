import type { Metadata } from 'next';

import { PageHeader } from '@/components/page-header';
import { OrdersDashboard } from '@/modules/orders/components/orders-dashboard';

export const metadata: Metadata = {
  title: 'Pesanan',
};

export default function OrdersPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Channel penjualan"
        title="Pesanan"
        description="Pesanan dari toko online. Begitu dibayar, stok otomatis tersinkronisasi."
      />
      <OrdersDashboard />
    </div>
  );
}
