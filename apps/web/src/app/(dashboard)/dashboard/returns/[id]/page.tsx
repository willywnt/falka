import type { Metadata } from 'next';

import { ReturnDetail } from '@/modules/returns/components/return-detail';

export const metadata: Metadata = {
  title: 'Retur',
};

export default async function ReturnDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return <ReturnDetail returnId={id} />;
}
