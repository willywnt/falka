import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { DepartureBoard } from '@/modules/orders/components/departure-board';

export const metadata: Metadata = {
  title: 'Papan keberangkatan',
};

export default function OrdersBoardPage() {
  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href="/dashboard/orders">
          <ArrowLeft className="size-4" />
          Kembali ke pesanan
        </Link>
      </Button>
      <PageHeader
        eyebrow="Kirim & retur"
        title="Papan keberangkatan"
        description="Pasang di layar meja packing — daftar paket menunggu, terekam, dan berangkat. Refresh otomatis."
      />
      <DepartureBoard />
    </div>
  );
}
