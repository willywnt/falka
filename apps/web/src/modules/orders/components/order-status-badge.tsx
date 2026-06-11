import type { OrderStatus } from '@prisma/client';

import { StatusBadge, type StatusTone } from '@/components/status-badge';

const STATUS_CONFIG: Record<OrderStatus, { label: string; tone: StatusTone }> = {
  PENDING: { label: 'Menunggu', tone: 'neutral' },
  PAID: { label: 'Dibayar', tone: 'info' },
  SHIPPED: { label: 'Terkirim', tone: 'info' },
  COMPLETED: { label: 'Selesai', tone: 'ok' },
  CANCELLED: { label: 'Dibatalkan', tone: 'danger' },
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const config = STATUS_CONFIG[status];
  return <StatusBadge tone={config.tone}>{config.label}</StatusBadge>;
}
