import type { Metadata } from 'next';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

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
      <Card>
        <CardHeader>
          <CardTitle>Coming soon</CardTitle>
          <CardDescription>
            Catalog management lands in Phase 1 of the inventory roadmap.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Products and variants will become the source of truth that feeds inventory levels and
            marketplace stock sync.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
