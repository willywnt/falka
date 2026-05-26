import type { Metadata } from 'next';

import { PageHeader } from '@/components/page-header';
import { RecordingsDashboard } from '@/modules/recordings/components/recordings-dashboard';

export const metadata: Metadata = {
  title: 'Recordings Library',
};

export default function DashboardRecordingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Recordings library"
        description="Browse, play, download, and manage your operational recordings."
      />
      <RecordingsDashboard />
    </div>
  );
}
