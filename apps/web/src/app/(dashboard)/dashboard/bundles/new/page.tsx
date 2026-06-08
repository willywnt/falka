import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/page-header';
import { BundleForm } from '@/modules/catalog/components/bundle-form';

export const metadata: Metadata = {
  title: 'Bundel baru',
};

export default function NewBundlePage() {
  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href="/dashboard/bundles">
          <ArrowLeft className="size-4" />
          Kembali ke bundel
        </Link>
      </Button>

      <PageHeader
        eyebrow="Katalog"
        title="Bundel baru"
        description="Beri nama paketnya, atur harganya, lalu tambahkan varian komponen dan berapa banyak tiap varian dalam satu bundel."
      />
      <BundleForm />
    </div>
  );
}
