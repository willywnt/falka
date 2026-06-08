import type { OrderStatus } from '@prisma/client';

import { Badge } from '@/components/ui/badge';

type BadgeVariant = 'default' | 'secondary' | 'outline' | 'destructive';

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; variant?: BadgeVariant; className?: string }
> = {
  PENDING: { label: 'Menunggu', variant: 'outline' },
  PAID: { label: 'Dibayar', className: 'bg-emerald-600 text-white hover:bg-emerald-600' },
  SHIPPED: { label: 'Terkirim', variant: 'secondary' },
  COMPLETED: { label: 'Selesai', variant: 'secondary' },
  CANCELLED: { label: 'Dibatalkan', variant: 'destructive' },
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <Badge variant={config.variant} className={config.className}>
      {config.label}
    </Badge>
  );
}
