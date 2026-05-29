import type { Metadata } from 'next';

import { PageHeader } from '@/components/page-header';
import { InventoryDashboard } from '@/modules/inventory/components/inventory-dashboard';

export const metadata: Metadata = {
  title: 'Inventory',
};

export default function DashboardInventoryPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory"
        description="Manage products, SKUs, and internal stock. Internal inventory is the source of truth for future marketplace sync."
      />
      <InventoryDashboard />
    </div>
  );
}
