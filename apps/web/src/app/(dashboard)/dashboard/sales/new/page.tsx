import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/page-header';
import { PosTerminal } from '@/modules/sales/components/pos-terminal';

export const metadata: Metadata = {
  title: 'Penjualan baru',
};

export default function NewSalePage() {
  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href="/dashboard/sales">
          <ArrowLeft className="size-4" />
          Kembali ke penjualan
        </Link>
      </Button>

      <PageHeader
        eyebrow="Channel penjualan"
        title="Penjualan baru"
        description="Cari produk, susun keranjang, lalu bayar — stok langsung diperbarui di semua channel."
      />
      <PosTerminal />
    </div>
  );
}
