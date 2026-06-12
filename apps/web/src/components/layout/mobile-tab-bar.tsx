'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import {
  isShellSuppressedRoute,
  MOBILE_TABS,
  resolveActiveHref,
} from '@/components/layout/nav-config';
import { useOpsPulse } from '@/components/layout/use-ops-pulse';
import { cn } from '@/lib/utils';

/** Bottom navigation for phones — in normal flow (no overlap hacks), hidden md+. */
export function MobileTabBar() {
  const pathname = usePathname();
  const pulse = useOpsPulse();

  if (isShellSuppressedRoute(pathname)) {
    return null;
  }

  const activeHref = resolveActiveHref(pathname, MOBILE_TABS);

  return (
    <nav
      aria-label="Navigasi bawah"
      className="bg-card/95 supports-[backdrop-filter]:bg-card/80 grid shrink-0 grid-cols-5 border-t backdrop-blur md:hidden"
    >
      {MOBILE_TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = tab.href === activeHref;
        const count = tab.pulse ? pulse[tab.pulse] : undefined;

        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'focus-visible:ring-ring/50 flex flex-col items-center gap-0.5 px-1 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] text-[10px] font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none',
              isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <span className="relative flex">
              <Icon className="size-5" aria-hidden />
              {count ? (
                <span
                  aria-label={`${count} perlu tindakan`}
                  className="num bg-highlight text-highlight-foreground absolute -top-1.5 -right-2.5 rounded-full px-1 py-px text-[9px] leading-none font-semibold"
                >
                  {count > 99 ? '99+' : count}
                </span>
              ) : null}
            </span>
            {tab.title}
          </Link>
        );
      })}
    </nav>
  );
}
