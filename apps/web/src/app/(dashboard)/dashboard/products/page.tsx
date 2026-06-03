import type { Metadata } from 'next';

import { PageHeader } from '@/components/page-header';
import { ProductsDashboard } from '@/modules/catalog/components/products-dashboard';

export const metadata: Metadata = {
  title: 'Products',
};

export default function ProductsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Products"
        description="Your product catalog — the master list of items you sell."
      />
      <ProductsDashboard />
    </div>
  );
}
