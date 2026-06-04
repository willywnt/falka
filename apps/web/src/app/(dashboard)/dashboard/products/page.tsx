import type { Metadata } from 'next';
import { Suspense } from 'react';

import { PageHeader } from '@/components/page-header';
import { ProductsDashboard } from '@/modules/catalog/components/products-dashboard';

export const metadata: Metadata = {
  title: 'Products',
};

export default function ProductsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Catalog"
        title="Products"
        description="Your product catalog — the master list of items you sell."
      />
      <Suspense fallback={null}>
        <ProductsDashboard />
      </Suspense>
    </div>
  );
}
