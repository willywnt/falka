import type { Metadata } from 'next';

import { PageHeader } from '@/components/page-header';
import { DepartureBoard } from '@/modules/orders/components/departure-board';

export const metadata: Metadata = {
  title: 'Papan keberangkatan',
};

export default function OrdersBoardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Kirim & retur"
        title="Papan keberangkatan"
        description="Pasang di layar meja packing — daftar paket menunggu, terekam, dan berangkat. Refresh otomatis."
      />
      <DepartureBoard />
    </div>
  );
}
