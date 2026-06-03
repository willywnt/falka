import type { Metadata } from 'next';

import { PageHeader } from '@/components/page-header';
import { OrdersDashboard } from '@/modules/orders/components/orders-dashboard';

export const metadata: Metadata = {
  title: 'Orders',
};

export default function OrdersPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Sales channels"
        title="Orders"
        description="Orders from your stores. Paid orders automatically reduce your stock."
      />
      <OrdersDashboard />
    </div>
  );
}
