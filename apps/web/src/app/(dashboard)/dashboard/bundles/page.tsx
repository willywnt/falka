import type { Metadata } from 'next';

import { PageHeader } from '@/components/page-header';
import { BundlesDashboard } from '@/modules/catalog/components/bundles-dashboard';

export const metadata: Metadata = {
  title: 'Bundel',
};

export default function BundlesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Katalog"
        title="Bundel"
        description="Paket jualan dari beberapa varian — punya SKU & harga sendiri, stok tetap ikut komponennya."
      />
      <BundlesDashboard />
    </div>
  );
}
