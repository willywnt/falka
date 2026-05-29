import type { Metadata } from 'next';

import { VariantDetailView } from '@/modules/inventory/components/variant-detail-view';

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  return { title: `Variant ${id.slice(0, 8)}…` };
}

export default async function VariantDetailPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <div className="space-y-6">
      <VariantDetailView variantId={id} />
    </div>
  );
}
