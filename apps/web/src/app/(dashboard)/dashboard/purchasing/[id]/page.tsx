import type { Metadata } from 'next';

import { requireOrgPermission } from '@/modules/auth/services/session';
import { PurchaseOrderDetail } from '@/modules/purchasing/components/purchase-order-detail';

export const metadata: Metadata = {
  title: 'Detail Pembelian',
};

export default async function PurchaseOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireOrgPermission('purchasing.view');
  const { id } = await params;

  return <PurchaseOrderDetail purchaseOrderId={id} />;
}
