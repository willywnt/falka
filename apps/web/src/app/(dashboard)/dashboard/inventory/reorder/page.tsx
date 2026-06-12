import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { ReorderReport } from '@/modules/inventory/components/reorder-report';

export const metadata: Metadata = {
  title: 'Saran restok',
};

export default function ReorderPage() {
  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href="/dashboard/inventory">
          <ArrowLeft className="size-4" />
          Kembali ke inventaris
        </Link>
      </Button>
      <PageHeader
        eyebrow="Stok"
        title="Saran restok"
        description="Seberapa cepat item terjual, berapa lama stok kamu bertahan, dan berapa yang perlu dibeli lagi."
      />
      <ReorderReport />
    </div>
  );
}
