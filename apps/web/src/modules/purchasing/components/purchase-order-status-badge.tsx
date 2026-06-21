import type { PurchaseOrderStatus } from '@prisma/client';

import { StatusBadge, type StatusTone } from '@/components/status-badge';

const STATUS_CONFIG: Record<PurchaseOrderStatus, { label: string; tone: StatusTone }> = {
  DRAFT: { label: 'Draf', tone: 'neutral' },
  ORDERED: { label: 'Dipesan', tone: 'info' },
  PARTIALLY_RECEIVED: { label: 'Diterima sebagian', tone: 'warn' },
  RECEIVED: { label: 'Diterima', tone: 'ok' },
  CANCELLED: { label: 'Dibatalkan', tone: 'danger' },
};

export function PurchaseOrderStatusBadge({ status }: { status: PurchaseOrderStatus }) {
  const config = STATUS_CONFIG[status];
  return <StatusBadge tone={config.tone}>{config.label}</StatusBadge>;
}
