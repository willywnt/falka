import type { Metadata } from 'next';

import { MarketplaceConnectionDetail } from '@/modules/marketplace/components/marketplace-connection-detail';

export const metadata: Metadata = {
  title: 'Marketplace store',
};

export default async function MarketplaceConnectionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <MarketplaceConnectionDetail connectionId={id} />;
}
