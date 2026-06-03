import type { Metadata } from 'next';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Inventory',
};

export default function InventoryPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory"
        description="Stock levels across your catalog — the source of truth for every channel."
      />
      <Card>
        <CardHeader>
          <CardTitle>Coming soon</CardTitle>
          <CardDescription>
            Stock tracking lands in Phase 1 of the inventory roadmap.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Available, reserved, damaged, and incoming stock will be tracked here, backed by an
            append-only ledger so every change is auditable.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
