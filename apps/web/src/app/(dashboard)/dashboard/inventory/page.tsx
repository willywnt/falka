import type { Metadata } from 'next';
import Link from 'next/link';
import { LineChart, ScrollText } from 'lucide-react';

import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { InventoryOverview } from '@/modules/inventory/components/inventory-overview';

export const metadata: Metadata = {
  title: 'Inventory',
};

export default function InventoryPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory"
        description="Stock levels across your catalog — the source of truth for every channel."
      >
        <Button asChild variant="outline">
          <Link href="/dashboard/inventory/activity">
            <ScrollText className="size-4" />
            Activity
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/dashboard/inventory/reorder">
            <LineChart className="size-4" />
            Reorder suggestions
          </Link>
        </Button>
      </PageHeader>
      <InventoryOverview />
    </div>
  );
}
