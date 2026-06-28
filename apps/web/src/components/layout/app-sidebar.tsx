'use client';

import Link from 'next/link';
import { APP_NAME } from '@palka/config/constants';
import { Plus } from 'lucide-react';

import { BrandBadge } from '@/components/brand-mark';
import { CREATE_ACTIONS, navItemAllowed } from '@/components/layout/nav-config';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { useSidebar } from '@/components/layout/sidebar-provider';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useOrg } from '@/modules/users/hooks/use-org';

/* The create menu reads CREATE_ACTIONS (nav-config) — same list as the palette,
 * filtered by the same role/permission gate so a STAFF without purchasing.view
 * never sees the "Buat PO" shortcut. */
function SidebarCreate({ collapsed }: { collapsed: boolean }) {
  const { org } = useOrg();
  const actions = CREATE_ACTIONS.filter((action) =>
    navItemAllowed(action, org?.role ?? null, org?.permissions ?? null),
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {collapsed ? (
          <Button size="icon" className="mx-auto">
            <Plus className="size-4" />
            <span className="sr-only">Buat</span>
          </Button>
        ) : (
          <Button className="w-full justify-start gap-2">
            <Plus className="size-4" />
            Buat
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-52">
        <DropdownMenuLabel>Buat</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <DropdownMenuItem key={action.title} asChild>
              <Link href={action.href}>
                <Icon className="size-4" />
                {action.title}
              </Link>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AppSidebar({ className }: { className?: string }) {
  const { collapsed } = useSidebar();

  return (
    <aside
      className={cn(
        'bg-sidebar text-sidebar-foreground border-sidebar-border hidden h-full shrink-0 flex-col border-r transition-all duration-200 md:flex',
        collapsed ? 'w-16' : 'w-64',
        className,
      )}
    >
      <div
        className={cn(
          'border-sidebar-border flex h-14 items-center border-b',
          collapsed ? 'justify-center px-2' : 'px-5',
        )}
      >
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <BrandBadge />
          {collapsed ? null : (
            <span className="text-base font-semibold tracking-tight">{APP_NAME}</span>
          )}
        </Link>
      </div>

      <div className={cn('py-3', collapsed ? 'px-2' : 'px-3')}>
        <SidebarCreate collapsed={collapsed} />
      </div>

      <div className="sidebar-scroll flex-1 overflow-y-auto pb-4">
        <SidebarNav collapsed={collapsed} />
      </div>

      {collapsed ? null : (
        <div className="border-sidebar-border text-sidebar-foreground/45 border-t px-5 py-3 text-xs">
          Lihat lebih tajam, jualan lebih tenang.
        </div>
      )}
    </aside>
  );
}
