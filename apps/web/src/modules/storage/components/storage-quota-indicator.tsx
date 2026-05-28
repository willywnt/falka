'use client';

import { AlertTriangle, HardDrive } from 'lucide-react';

import { formatStoragePercent, formatStorageUsage } from '@/lib/formatters';
import { Skeleton } from '@/components/ui/skeleton';

import { useStorageQuotaQuery } from '../hooks/use-storage-quota';
import {
  getStorageQuotaBarClassName,
  getStorageQuotaContainerClassName,
  getStorageQuotaLevel,
  getStorageQuotaWarningMessage,
  type StorageQuotaLevel,
} from '../utils/quota-status';

function WarningText({ level, message }: { level: StorageQuotaLevel; message: string }) {
  return (
    <p
      className={`flex items-start gap-2 text-xs leading-snug ${
        level === 'warning' ? 'text-amber-950 dark:text-amber-100' : 'text-destructive'
      }`}
    >
      <AlertTriangle className="mt-0.5 size-4 shrink-0" />
      {message}
    </p>
  );
}

export function StorageQuotaIndicator({
  showIcon = true,
  className,
  variant = 'full',
}: {
  showIcon?: boolean;
  className?: string;
  variant?: 'full' | 'warning-only';
}) {
  const { data, isLoading, isError } = useStorageQuotaQuery();

  if (isLoading) {
    if (variant === 'warning-only') return null;

    return (
      <div className={`rounded-lg border px-4 py-3 ${className ?? ''}`}>
        <Skeleton className="mb-2 h-4 w-40" />
        <Skeleton className="mb-2 h-2 w-full" />
        <Skeleton className="h-3 w-28" />
      </div>
    );
  }

  if (isError || !data) return null;

  const level = getStorageQuotaLevel(data.usagePercent);
  const warningMessage = getStorageQuotaWarningMessage(level);

  if (variant === 'warning-only') {
    if (level === 'normal' || !warningMessage) return null;

    return (
      <div
        className={`rounded-lg border px-4 py-3 text-sm ${getStorageQuotaContainerClassName(level)} ${className ?? ''}`}
      >
        <p className="font-medium">
          Cloud storage{' '}
          <span className="tabular-nums">
            {formatStoragePercent(data.usedBytes, data.quotaBytes)} full
          </span>
          <span className="text-muted-foreground font-normal">
            {' '}
            · {formatStorageUsage(data.usedBytes, data.quotaBytes)} used
          </span>
        </p>
        <div className="mt-2">
          <WarningText level={level} message={warningMessage} />
        </div>
      </div>
    );
  }

  const safePercent = Math.max(0, Math.min(100, data.usagePercent));

  return (
    <div
      className={`rounded-lg border px-4 py-3 text-sm ${getStorageQuotaContainerClassName(level)} ${className ?? ''}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {showIcon ? <HardDrive className="text-muted-foreground size-4 shrink-0" /> : null}
          <span className="font-medium">Cloud storage</span>
        </div>
        <span className="font-medium tabular-nums">
          {formatStoragePercent(data.usedBytes, data.quotaBytes)}
        </span>
      </div>

      <div className="bg-muted/80 mt-3 h-2 overflow-hidden rounded-full">
        <div
          className={`h-full transition-all duration-200 ${getStorageQuotaBarClassName(level)}`}
          style={{ width: `${safePercent}%` }}
        />
      </div>

      <p className="text-muted-foreground mt-2 text-xs tabular-nums">
        {formatStorageUsage(data.usedBytes, data.quotaBytes)} used
      </p>

      {warningMessage ? (
        <div className="mt-2">
          <WarningText level={level} message={warningMessage} />
        </div>
      ) : null}
    </div>
  );
}
