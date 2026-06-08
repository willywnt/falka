import type { Metadata } from 'next';

import { PageHeader } from '@/components/page-header';
import { LabelsTabs } from '@/modules/catalog/components/labels-tabs';

export const metadata: Metadata = {
  title: 'Label',
};

export default function LabelsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Katalog"
        title="Label"
        description="Cetak label QR untuk varian dan bundel kamu — tiap label memuat barcode (atau SKU) untuk scan di kasir."
      />
      <LabelsTabs />
    </div>
  );
}
