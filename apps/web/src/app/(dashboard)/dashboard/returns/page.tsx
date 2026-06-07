import type { Metadata } from 'next';

import { PageHeader } from '@/components/page-header';
import { ReturnsDashboard } from '@/modules/returns/components/returns-dashboard';

export const metadata: Metadata = {
  title: 'Retur',
};

export default function ReturnsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Pengemasan"
        title="Retur"
        description="Barang yang dikembalikan. Terima retur untuk merestok unit yang masih layak jual atau hapus stok rusak."
      />
      <ReturnsDashboard />
    </div>
  );
}
