'use client';

import type { Route } from 'next';
import Link from 'next/link';
import { Bell, CheckCheck, Info, TriangleAlert } from 'lucide-react';

import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';
import { TablePagination } from '@/components/table-pagination';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { usePagination } from '@/hooks/use-pagination';
import { formatDateTime } from '@/lib/formatters';
import {
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
  useNotificationsHistoryQuery,
} from '@/modules/notifications/hooks/use-notifications-data';
import { severityToTone } from '@/modules/notifications/notification-meta';
import type { NotificationListItem } from '@/modules/notifications/types';
import { cn } from '@/lib/utils';

function NotificationHistoryRow({
  item,
  onSelect,
}: {
  item: NotificationListItem;
  onSelect: (id: string) => void;
}) {
  const urgent = severityToTone(item.severity) === 'urgent';
  const Icon = urgent ? TriangleAlert : Info;

  const inner = (
    <div className="flex items-start gap-3 px-4 py-3">
      <Icon
        aria-hidden
        className={cn(
          'mt-0.5 size-4 shrink-0',
          urgent ? 'text-highlight-strong' : 'text-muted-foreground',
        )}
      />
      <div className="min-w-0 flex-1 space-y-0.5">
        <p className="flex items-center gap-1.5 text-sm font-medium">
          <span className="min-w-0 truncate">{item.title}</span>
          {!item.read ? (
            <span aria-hidden className="bg-highlight size-1.5 shrink-0 rounded-full" />
          ) : null}
        </p>
        <p className="text-muted-foreground text-xs text-pretty">{item.body}</p>
      </div>
      <span className="text-muted-foreground num shrink-0 text-xs">
        {formatDateTime(item.createdAt)}
      </span>
    </div>
  );

  return (
    <li className={cn(!item.read && 'bg-accent/30')}>
      {item.href ? (
        <Link
          href={item.href as Route}
          onClick={() => onSelect(item.id)}
          className="hover:bg-accent/60 block transition-colors"
        >
          {inner}
        </Link>
      ) : (
        <button
          type="button"
          onClick={() => onSelect(item.id)}
          className="hover:bg-accent/60 block w-full text-left transition-colors"
        >
          {inner}
        </button>
      )}
    </li>
  );
}

/** The "Lihat semua" notification history — the full paginated persisted event-log. */
export function NotificationsHistory() {
  const { page, setPage, pageSize, setPageSize } = usePagination(20);
  const { data, isLoading, error, refetch } = useNotificationsHistoryQuery(page, pageSize);
  const markRead = useMarkNotificationReadMutation();
  const markAllRead = useMarkAllNotificationsReadMutation();

  const unreadCount = data?.meta?.unreadCount ?? 0;

  return (
    <div className="space-y-3">
      {unreadCount > 0 ? (
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
          >
            <CheckCheck className="size-4" />
            Tandai semua dibaca
          </Button>
        </div>
      ) : null}

      {error ? (
        <ErrorState
          title="Gagal memuat notifikasi"
          description={error instanceof Error ? error.message : undefined}
          onRetry={() => void refetch()}
        />
      ) : isLoading || !data ? (
        <Skeleton className="h-64 w-full" />
      ) : data.items.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="Belum ada notifikasi"
          description="Peristiwa penting — jual di bawah modal, pesanan baru, retur, penerimaan PO, opname — akan muncul di sini."
        />
      ) : (
        <div className="space-y-3">
          <ul className="divide-y overflow-hidden rounded-xl border">
            {data.items.map((item) => (
              <NotificationHistoryRow
                key={item.id}
                item={item}
                onSelect={(id) => markRead.mutate(id)}
              />
            ))}
          </ul>
          {data.meta ? (
            <TablePagination
              page={data.meta.page}
              pageSize={pageSize}
              total={data.meta.total}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          ) : null}
        </div>
      )}
    </div>
  );
}
