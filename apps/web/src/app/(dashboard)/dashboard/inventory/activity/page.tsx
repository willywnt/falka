import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { ArrowLeft } from 'lucide-react';

import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { StockActivity } from '@/modules/inventory/components/stock-activity';

export const metadata: Metadata = {
  title: 'Aktivitas stok',
};

export default function StockActivityPage() {
  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href="/dashboard/inventory">
          <ArrowLeft className="size-4" />
          Kembali ke inventaris
        </Link>
      </Button>
      <PageHeader
        eyebrow="Inventaris"
        title="Aktivitas stok"
        description="Setiap perubahan stok, terbaru di atas — cari dan ekspor seluruh riwayatnya."
      />
      <Suspense fallback={null}>
        <StockActivity />
      </Suspense>
    </div>
  );
}
