import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { DashboardShell } from '@/components/layout/dashboard-shell';
import { getCurrentUser } from '@/modules/auth/services/session';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Platform admin-ops operators live in /admin and never see the shop dashboard.
  const user = await getCurrentUser();
  if (user?.role === 'ADMIN') {
    redirect('/admin');
  }

  const cookieStore = await cookies();
  const defaultCollapsed = cookieStore.get('sidebar_collapsed')?.value === '1';
  const sectionsRaw = cookieStore.get('sidebar_sections')?.value ?? '';
  const defaultCollapsedSections = sectionsRaw ? sectionsRaw.split(',').filter(Boolean) : [];

  return (
    <DashboardShell
      defaultCollapsed={defaultCollapsed}
      defaultCollapsedSections={defaultCollapsedSections}
    >
      {children}
    </DashboardShell>
  );
}
