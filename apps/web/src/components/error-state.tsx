'use client';

import { CircleAlert } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * Consistent query-failure placeholder — the error twin of EmptyState. Always
 * offers a way forward (retry wired to the query's refetch) so a failed fetch
 * never masquerades as "belum ada data".
 */
export function ErrorState({
  title = 'Gagal memuat data',
  description = 'Coba lagi, ya — kalau masih gagal, muat ulang halamannya.',
  onRetry,
  className,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'border-destructive/30 bg-destructive/5 flex flex-col items-center gap-3 rounded-lg border border-dashed p-8 text-center',
        className,
      )}
    >
      <div className="bg-destructive/10 text-destructive flex size-10 items-center justify-center rounded-full">
        <CircleAlert className="size-5" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium">{title}</p>
        {description ? (
          <p className="text-muted-foreground mx-auto max-w-sm text-xs text-pretty">
            {description}
          </p>
        ) : null}
      </div>
      {onRetry ? (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Coba lagi
        </Button>
      ) : null}
    </div>
  );
}
