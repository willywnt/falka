import { cookies } from 'next/headers';

import { DashboardShell } from '@/components/layout/dashboard-shell';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
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
