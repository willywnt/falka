'use client';

import { useState } from 'react';
import type { Route } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Boxes,
  LineChart,
  ScrollText,
  ShoppingCart,
  Video,
  type LucideIcon,
} from 'lucide-react';
import { toast } from 'sonner';

import { STAT_TONES, type StatTone } from '@/components/stat-card';
import { WaveHairline } from '@/components/maritime-art';
import { routePanduQuery } from '@/components/pandu/pandu-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

function todayLabel(): string {
  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());
}

export function DashboardHome() {
  const { user } = useCurrentUser();
  const router = useRouter();
  const [question, setQuestion] = useState('');
  const firstName = (user?.displayName ?? user?.email ?? '').split(/[\s@]/)[0];

  function askPandu(event: React.FormEvent) {
    event.preventDefault();
    const destination = routePanduQuery(question);
    if (destination) {
      router.push(destination.href);
      return;
    }
    toast.info('Pandu belum paham yang itu.', {
      description: 'Coba kata kunci seperti "restok", "pesanan", "laba", atau nama produk.',
    });
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4 pt-1">
        <div className="space-y-1.5">
          <p className="eyebrow text-primary" suppressHydrationWarning>
            Anjungan · {todayLabel()}
          </p>
          <h1 className="text-2xl font-semibold tracking-tight" suppressHydrationWarning>
            {greeting()}
            {firstName ? `, ${firstName}` : ''} 👋
          </h1>
          <p className="text-muted-foreground text-sm">
            Ringkasan toko kamu — stok, pesanan, dan yang perlu diperhatikan hari ini.
          </p>
        </div>

        {/* Pandu NL bar (hero) — same honest router as the dock; hidden on phones (the dock covers it). */}
        <form onSubmit={askPandu} className="hidden max-w-xl items-center gap-2 sm:flex">
          <Input
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder='Tanya Pandu… (mis. "apa yang perlu direstok?")'
            aria-label="Tanya Pandu"
            className="bg-card h-10"
          />
          <Button
            type="submit"
            size="icon"
            className="size-10 shrink-0"
            disabled={!question.trim()}
          >
            <ArrowRight className="size-4" />
            <span className="sr-only">Kirim pertanyaan ke Pandu</span>
          </Button>
        </form>

        <div className="grid gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
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

        <WaveHairline />
      </div>

      <InventoryDashboard />
    </div>
  );
}
