import type { Metadata } from 'next';

import { AdminConsole } from '@/modules/admin/components/admin-console';

export const metadata: Metadata = {
  title: 'Admin Ops',
};

export default function AdminPage() {
  return <AdminConsole />;
}
