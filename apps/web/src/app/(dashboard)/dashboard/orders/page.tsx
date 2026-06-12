import type { Metadata } from 'next';
import Link from 'next/link';
import { MonitorPlay } from 'lucide-react';

import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { OrdersDashboard } from '@/modules/orders/components/orders-dashboard';

export const metadata: Metadata = {
  title: 'Pesanan',
};

export default function OrdersPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Jualan"
        title="Pesanan"
        description="Pesanan dari toko online. Begitu dibayar, stok otomatis tersinkronisasi."
      >
        <Button variant="outline" asChild>
          <Link href="/dashboard/orders/board">
            <MonitorPlay className="size-4" />
            Papan keberangkatan
          </Link>
        </Button>
      </PageHeader>
      <OrdersDashboard />
    </div>
  );
}
