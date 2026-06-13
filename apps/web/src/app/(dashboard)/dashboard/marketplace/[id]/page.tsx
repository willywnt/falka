import type { Metadata } from 'next';

import { requireOrgPermission } from '@/modules/auth/services/session';
import { MarketplaceConnectionDetail } from '@/modules/marketplace/components/marketplace-connection-detail';

export const metadata: Metadata = {
  title: 'Toko marketplace',
};

export default async function MarketplaceConnectionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireOrgPermission('marketplace.view');
  const { id } = await params;

  return <MarketplaceConnectionDetail connectionId={id} />;
}
