'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { usePathname } from 'next/navigation';
import { Boxes, LayoutDashboard, Settings, ShoppingBag, Video } from 'lucide-react';

import { cn } from '@/lib/utils';

export const sidebarNavItems = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Recordings',
    href: '/dashboard/recordings',
    icon: Video,
  },
  {
    title: 'Marketplace',
    href: '/dashboard/marketplace',
    icon: ShoppingBag,
  },
  {
    title: 'Inventory',
    href: '/dashboard/inventory',
    icon: Boxes,
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: Settings,
  },
] as const;

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1 px-3">
      {sidebarNavItems.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href as Route}
            onClick={onNavigate}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
            )}
          >
            <Icon className="size-4 shrink-0" />
            {item.title}
          </Link>
        );
      })}
    </nav>
  );
}
