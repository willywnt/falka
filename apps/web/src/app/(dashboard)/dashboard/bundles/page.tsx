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
        description="Paket yang dijual jadi satu SKU dan motong stok varian komponennya. Bundel nggak punya stok sendiri — jumlah yang bisa dijual dihitung dari komponennya."
      />
      <BundlesDashboard />
    </div>
  );
}
