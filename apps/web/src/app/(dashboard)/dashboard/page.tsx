import type { Metadata } from 'next';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata: Metadata = {
  title: 'Dashboard',
};

export default function DashboardPage() {
  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Overview of recordings, storage, and marketplace activity."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {['Recordings', 'Storage Used', 'Marketplace Sync', 'Audit Events'].map((label) => (
          <Card key={label}>
            <CardHeader className="pb-2">
              <CardDescription>{label}</CardDescription>
              <CardTitle className="text-3xl">
                <Skeleton className="h-8 w-16" />
              </CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Recordings</CardTitle>
            <CardDescription>Your latest operational recordings</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">No recordings yet. Start from the Recordings page.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Marketplace Status</CardTitle>
            <CardDescription>Connected stores and sync status</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">No marketplace connections configured.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
