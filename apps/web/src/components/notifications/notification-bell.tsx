'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, CheckCheck, Info, TriangleAlert } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

import { useNotifications, type AppNotification } from './use-notifications';

function NotificationRow({
  notification,
  onSelect,
}: {
  notification: AppNotification;
  onSelect: (id: string) => void;
}) {
  const Icon = notification.tone === 'urgent' ? TriangleAlert : Info;

  return (
    <li>
      <Link
        href={notification.href}
        onClick={() => onSelect(notification.id)}
        className="hover:bg-accent/60 flex items-start gap-2.5 px-4 py-3 transition-colors"
      >
        <Icon
          aria-hidden
          className={cn(
            'mt-0.5 size-4 shrink-0',
            notification.tone === 'urgent' ? 'text-highlight-strong' : 'text-muted-foreground',
          )}
        />
        <div className="min-w-0 flex-1 space-y-0.5">
          <p className="flex items-center gap-1.5 text-sm font-medium">
            <span className="min-w-0 truncate">{notification.title}</span>
            {!notification.read ? (
              <span aria-hidden className="bg-highlight size-1.5 shrink-0 rounded-full" />
            ) : null}
          </p>
          <p className="text-muted-foreground text-xs text-pretty">{notification.description}</p>
        </div>
      </Link>
    </li>
  );
}

/**
 * The navbar notification bell + tray (Suar Dermaga shell pattern): a live
 * "needs my attention" inbox derived from existing queries (see
 * use-notifications). Unread/seen state is client-only and persisted (mirrors
 * the Pandu dock), so the unread badge renders only after mount to keep SSR and
 * the first client paint in agreement.
 */
export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const { items, unreadCount, hasUrgentUnread, isLoading, isError, markRead, markAllRead } =
    useNotifications();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close the tray whenever the user navigates.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const showBadge = mounted && unreadCount > 0;

  function handleSelect(id: string) {
    markRead(id);
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={showBadge ? `Notifikasi — ${unreadCount} belum dibaca` : 'Notifikasi'}
        >
          <Bell className="size-4" />
          {showBadge ? (
            <span
              aria-hidden
              className={cn(
                'absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] leading-none font-semibold',
                hasUrgentUnread
                  ? 'bg-highlight text-highlight-foreground'
                  : 'bg-primary text-primary-foreground',
              )}
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[360px] max-w-[calc(100vw-1.5rem)] p-0">
        <header className="flex items-center justify-between gap-2 border-b px-4 py-3">
          <p className="text-sm font-semibold tracking-tight">Notifikasi</p>
          {mounted && unreadCount > 0 ? (
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground h-7 gap-1.5 px-2"
              onClick={() => markAllRead()}
            >
              <CheckCheck className="size-3.5" />
              Tandai dibaca
            </Button>
          ) : null}
        </header>

        <div className="max-h-[60svh] overflow-y-auto">
          {isLoading ? (
            <div className="space-y-2 p-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : isError && items.length === 0 ? (
            <p className="text-muted-foreground p-4 text-sm">
              Notifikasi nggak bisa dimuat sekarang — coba buka lagi nanti.
            </p>
          ) : items.length === 0 ? (
            <p className="text-muted-foreground p-4 text-sm">
              Laut tenang — nggak ada yang perlu perhatian khusus sekarang.
            </p>
          ) : (
            <ul className="divide-y">
              {items.map((notification) => (
                <NotificationRow
                  key={notification.id}
                  notification={notification}
                  onSelect={handleSelect}
                />
              ))}
            </ul>
          )}
        </div>

        <Link
          href="/dashboard/notifications"
          onClick={() => setOpen(false)}
          className="text-muted-foreground hover:text-foreground block border-t px-4 py-2.5 text-center text-xs font-medium transition-colors"
        >
          Lihat semua notifikasi
        </Link>
      </PopoverContent>
    </Popover>
  );
}
