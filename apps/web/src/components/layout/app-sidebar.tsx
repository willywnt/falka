'use client';

import Link from 'next/link';
import { APP_NAME } from '@olshop/config/constants';

import { SidebarNav } from '@/components/layout/sidebar-nav';
import { cn } from '@/lib/utils';
import { useUiStore } from '@/store/ui-store';

export function AppSidebar({ className }: { className?: string }) {
  const sidebarOpen = useUiStore((state) => state.sidebarOpen);

  return (
    <aside
      className={cn(
        'bg-sidebar text-sidebar-foreground border-sidebar-border hidden h-full w-64 shrink-0 flex-col border-r transition-all duration-200 md:flex',
        !sidebarOpen && 'md:w-0 md:overflow-hidden md:border-r-0',
        className,
      )}
    >
      <div className="flex h-14 items-center border-b border-sidebar-border px-6">
        <Link href="/dashboard" className="text-lg font-semibold tracking-tight">
          {APP_NAME}
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto py-4">
        <SidebarNav />
      </div>
    </aside>
  );
}
