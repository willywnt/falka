import Link from 'next/link';
import { ArrowLeft, LogOut } from 'lucide-react';
import { APP_NAME } from '@palka/config/constants';

import { BrandBadge } from '@/components/brand-mark';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { logoutAction } from '@/modules/auth/actions/logout';
import { requirePlatformAdmin } from '@/modules/auth/services/session';

/**
 * Platform-operator chrome — deliberately NOT the shop dashboard shell. A single
 * top bar (brand + "Admin Ops" + link back to the shop dashboard + logout) over
 * a centered content container. Guarded by `requirePlatformAdmin()`: a non-admin
 * is redirected to /dashboard before any console markup renders.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requirePlatformAdmin();

  return (
    <div className="bg-muted/30 flex min-h-screen flex-col">
      <header className="bg-background/95 supports-[backdrop-filter]:bg-background/80 sticky top-0 z-40 border-b backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2.5">
            <BrandBadge />
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold tracking-tight">{APP_NAME}</span>
              <span className="eyebrow text-muted-foreground">Admin Ops</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard"
              className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}
            >
              <ArrowLeft className="size-4" />
              <span className="hidden sm:inline">Ke dashboard</span>
            </Link>
            <form action={logoutAction}>
              <Button type="submit" variant="outline" size="sm">
                <LogOut className="size-4" />
                <span className="hidden sm:inline">Keluar</span>
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6 sm:py-8">{children}</main>
    </div>
  );
}
