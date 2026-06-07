import type { ReturnStatus } from '@prisma/client';

import { Badge } from '@/components/ui/badge';

type BadgeVariant = 'default' | 'secondary' | 'outline' | 'destructive';

const STATUS_CONFIG: Record<
  ReturnStatus,
  { label: string; variant?: BadgeVariant; className?: string }
> = {
  PENDING: {
    label: 'Menunggu barang',
    variant: 'outline',
    className: 'border-amber-500 text-amber-600',
  },
  RECEIVED: { label: 'Diterima', className: 'bg-emerald-600 text-white hover:bg-emerald-600' },
  REJECTED: { label: 'Ditolak', variant: 'destructive' },
};

export function ReturnStatusBadge({ status }: { status: ReturnStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <Badge variant={config.variant} className={config.className}>
      {config.label}
    </Badge>
  );
}
