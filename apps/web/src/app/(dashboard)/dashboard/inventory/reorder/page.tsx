import type { Metadata } from 'next';

import { PageHeader } from '@/components/page-header';
import { ReorderReport } from '@/modules/inventory/components/reorder-report';

export const metadata: Metadata = {
  title: 'Reorder suggestions',
};

export default function ReorderPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Inventory"
        title="Reorder suggestions"
        description="How fast items sell, how long your stock will last, and how much to buy again."
      />
      <ReorderReport />
    </div>
  );
}
