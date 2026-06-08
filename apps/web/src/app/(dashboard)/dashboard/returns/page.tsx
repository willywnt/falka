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
        eyebrow="Fulfillment"
        title="Retur"
        description="Barang yang dikembalikan pembeli. Proses returnya buat restok unit yang masih layak jual, atau hapus stok yang rusak."
      />
      <ReturnsDashboard />
    </div>
  );
}
