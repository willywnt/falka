import type { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import { LineChart, ScrollText } from 'lucide-react';

import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { InventoryOverview } from '@/modules/inventory/components/inventory-overview';

export const metadata: Metadata = {
  title: 'Inventaris',
};

export default function InventoryPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Katalog"
        title="Inventaris"
        description="Berapa banyak stok tiap item kamu, selalu sinkron di semua channel penjualan."
      >
        <Button asChild variant="outline">
          <Link href="/dashboard/inventory/activity">
            <ScrollText className="size-4" />
            Aktivitas
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/dashboard/inventory/reorder">
            <LineChart className="size-4" />
            Saran restok
          </Link>
        </Button>
      </PageHeader>
      <Suspense fallback={null}>
        <InventoryOverview />
      </Suspense>
    </div>
  );
}
