import { formatBytes, formatDate, formatDuration } from '@olshop/utils/date';

export { formatDate, formatDuration, formatBytes as formatFileSize };

const STABLE_DATETIME_FORMAT = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

export function formatDateTime(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return 'Invalid date';
  return STABLE_DATETIME_FORMAT.format(date);
}

export function formatRelativeTime(date: Date): string {
  const diffMs = date.getTime() - Date.now();
  const diffSec = Math.round(diffMs / 1000);
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

  const absSec = Math.abs(diffSec);
  if (absSec < 60) return rtf.format(diffSec, 'second');

  const diffMin = Math.round(diffSec / 60);
  if (Math.abs(diffMin) < 60) return rtf.format(diffMin, 'minute');

  const diffHour = Math.round(diffMin / 60);
  if (Math.abs(diffHour) < 24) return rtf.format(diffHour, 'hour');

  const diffDay = Math.round(diffHour / 24);
  return rtf.format(diffDay, 'day');
}

export function formatStorageUsage(usedBytes: number, quotaBytes: number): string {
  return `${formatBytes(usedBytes)} / ${formatBytes(quotaBytes)}`;
}

export function formatStoragePercent(usedBytes: number, quotaBytes: number): string {
  if (quotaBytes === 0) return '100%';
  return `${Math.min(100, Math.round((usedBytes / quotaBytes) * 100))}%`;
}
