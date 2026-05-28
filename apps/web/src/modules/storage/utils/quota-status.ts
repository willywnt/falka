import {
  STORAGE_QUOTA_CRITICAL_PERCENT,
  STORAGE_QUOTA_WARNING_PERCENT,
} from '@olshop/config/limits';

export type StorageQuotaLevel = 'normal' | 'warning' | 'critical' | 'full';

export function getStorageQuotaLevel(usagePercent: number): StorageQuotaLevel {
  if (usagePercent >= 100) return 'full';
  if (usagePercent >= STORAGE_QUOTA_CRITICAL_PERCENT) return 'critical';
  if (usagePercent >= STORAGE_QUOTA_WARNING_PERCENT) return 'warning';
  return 'normal';
}

export function isStorageQuotaExceeded(quota: {
  remainingBytes: number;
  usagePercent: number;
}): boolean {
  return quota.remainingBytes <= 0 || quota.usagePercent >= 100;
}

export function getStorageQuotaWarningMessage(level: StorageQuotaLevel): string | null {
  switch (level) {
    case 'full':
      return 'Storage quota is full. Delete recordings or contact your administrator to increase quota.';
    case 'critical':
      return 'Storage is almost full. Delete old recordings to avoid upload failures.';
    case 'warning':
      return 'Storage usage is getting high. Consider deleting old recordings to free space.';
    default:
      return null;
  }
}

export function getStorageQuotaBarClassName(level: StorageQuotaLevel): string {
  switch (level) {
    case 'full':
    case 'critical':
      return 'bg-destructive';
    case 'warning':
      return 'bg-amber-500';
    default:
      return 'bg-primary';
  }
}

export function getStorageQuotaContainerClassName(level: StorageQuotaLevel): string {
  switch (level) {
    case 'full':
    case 'critical':
      return 'border-destructive/40 bg-destructive/10';
    case 'warning':
      return 'border-amber-500/40 bg-amber-500/10';
    default:
      return 'border-border bg-muted/30';
  }
}
