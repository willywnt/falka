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
        title="Reorder suggestions"
        description="Sales velocity, days of cover, and how much to reorder — from your stock ledger."
      />
      <ReorderReport />
    </div>
  );
}
