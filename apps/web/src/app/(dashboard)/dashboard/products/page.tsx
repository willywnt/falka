import type { Metadata } from 'next';
import { Suspense } from 'react';

import { PageHeader } from '@/components/page-header';
import { ProductsDashboard } from '@/modules/catalog/components/products-dashboard';

export const metadata: Metadata = {
  title: 'Produk',
};

export default function ProductsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Katalog"
        title="Produk"
        description="Katalog produk kamu — semua item yang kamu jual ada di sini."
      />
      <Suspense fallback={null}>
        <ProductsDashboard />
      </Suspense>
    </div>
  );
}
