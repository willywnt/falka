'use client';

import type { Route } from 'next';
import Link from 'next/link';
import { Boxes, LineChart, ScrollText, ShoppingCart, Video, type LucideIcon } from 'lucide-react';

import { STAT_TONES, type StatTone } from '@/components/stat-card';
import { useCurrentUser } from '@/modules/auth/hooks/use-current-user';
import { InventoryDashboard } from '@/modules/inventory/components/inventory-dashboard';
import { cn } from '@/lib/utils';

type QuickAction = {
  label: string;
  description: string;
  href: Route;
  icon: LucideIcon;
  tone: StatTone;
};

const QUICK_ACTIONS: QuickAction[] = [
  {
    label: 'Produk baru',
    description: 'Tambah ke katalog',
    href: '/dashboard/products',
    icon: Boxes,
    tone: 'sky',
  },
  {
    label: 'Tarik pesanan',
    description: 'Sinkronisasi dari toko',
    href: '/dashboard/marketplace',
    icon: ShoppingCart,
    tone: 'amber',
  },
  {
    label: 'Rekam packing',
    description: 'Bukti per paket',
    href: '/recordings',
    icon: Video,
    tone: 'rose',
  },
  {
    label: 'Restok',
    description: 'Yang perlu dibeli lagi',
    href: '/dashboard/inventory/reorder',
    icon: LineChart,
    tone: 'emerald',
  },
  {
    label: 'Aktivitas',
    description: 'Riwayat stok',
    href: '/dashboard/inventory/activity',
    icon: ScrollText,
    tone: 'violet',
  },
];

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Selamat pagi';
  if (hour < 18) return 'Selamat siang';
  return 'Selamat malam';
}

export function DashboardHome() {
  const { user } = useCurrentUser();
  const firstName = (user?.displayName ?? user?.email ?? '').split(/[\s@]/)[0];

  return (
    <div className="space-y-6">
      <div className="from-primary/10 rounded-2xl border bg-gradient-to-br to-transparent p-6">
        <p className="text-2xl font-semibold tracking-tight" suppressHydrationWarning>
          {greeting()}
          {firstName ? `, ${firstName}` : ''} 👋
        </p>
        <p className="text-muted-foreground mt-1 text-sm">
          Ringkasan toko kamu — stok, pesanan, dan yang perlu diperhatikan hari ini.
        </p>

        <div className="mt-5 grid gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.label}
                href={action.href}
                className="bg-card hover:border-primary/40 hover:bg-accent/50 group flex items-center gap-3 rounded-xl border p-3 transition-colors"
              >
                <span
                  className={cn(
                    'flex size-9 shrink-0 items-center justify-center rounded-lg',
                    STAT_TONES[action.tone],
                  )}
                >
                  <Icon className="size-5" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{action.label}</span>
                  <span className="text-muted-foreground block truncate text-xs">
                    {action.description}
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      <InventoryDashboard />
    </div>
  );
}
