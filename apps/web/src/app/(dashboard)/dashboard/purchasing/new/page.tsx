import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/page-header';
import { PoForm } from '@/modules/purchasing/components/po-form';

export const metadata: Metadata = {
  title: 'Pembelian baru',
};

export default function NewPurchaseOrderPage() {
  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href="/dashboard/purchasing">
          <ArrowLeft className="size-4" />
          Kembali ke pembelian
        </Link>
      </Button>

      <PageHeader
        eyebrow="Stok"
        title="Pembelian baru"
        description="Cari produk atau muat saran restok, atur jumlah + modal, lalu buat pesanan."
      />
      <PoForm />
    </div>
  );
}
