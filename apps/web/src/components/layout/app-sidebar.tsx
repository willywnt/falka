'use client';

import Link from 'next/link';
import { APP_NAME } from '@olshop/config/constants';
import { Boxes, Plus, ShoppingBag, Video } from 'lucide-react';

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

function SidebarCreate({ collapsed }: { collapsed: boolean }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {collapsed ? (
          <Button size="icon" className="mx-auto" title="Buat">
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
        <DropdownMenuItem asChild>
          <Link href="/dashboard/products">
            <Boxes className="size-4" />
            Produk baru
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/dashboard/marketplace">
            <ShoppingBag className="size-4" />
            Hubungkan toko
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/recordings">
            <Video className="size-4" />
            Rekam packing
          </Link>
        </DropdownMenuItem>
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
          <span className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-lg text-sm font-bold shadow-sm">
            {APP_NAME.charAt(0)}
          </span>
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
          Inventaris &amp; pengemasan
        </div>
      )}
    </aside>
  );
}
