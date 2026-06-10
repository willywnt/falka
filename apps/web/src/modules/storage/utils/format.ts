import { formatBytes } from '@falka/utils/date';

export { formatBytes as formatFileSize };

export function formatQuotaSummary(
  usedBytes: number | bigint,
  quotaBytes: number | bigint,
): string {
  return `${formatBytes(Number(usedBytes))} / ${formatBytes(Number(quotaBytes))}`;
}
