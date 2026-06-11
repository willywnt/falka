import type { ReturnStatus } from '@prisma/client';

import { StatusBadge, type StatusTone } from '@/components/status-badge';

const STATUS_CONFIG: Record<ReturnStatus, { label: string; tone: StatusTone }> = {
  PENDING: { label: 'Menunggu barang', tone: 'warn' },
  RECEIVED: { label: 'Diterima', tone: 'ok' },
  REJECTED: { label: 'Ditolak', tone: 'danger' },
};

export function ReturnStatusBadge({ status }: { status: ReturnStatus }) {
  const config = STATUS_CONFIG[status];
  return <StatusBadge tone={config.tone}>{config.label}</StatusBadge>;
}
