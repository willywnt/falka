import type { Metadata } from 'next';

import { PageHeader } from '@/components/page-header';
import { requireOrgPermission } from '@/modules/auth/services/session';
import { SuppliersDashboard } from '@/modules/purchasing/components/suppliers-dashboard';

export const metadata: Metadata = {
  title: 'Pemasok',
};

export default async function SuppliersPage() {
  await requireOrgPermission('purchasing.view');

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Stok"
        title="Pemasok"
        description="Data pemasok dengan lead time & MOQ default. Laporan reorder memakainya saat varian belum punya nilainya sendiri."
      />
      <SuppliersDashboard />
    </div>
  );
}
