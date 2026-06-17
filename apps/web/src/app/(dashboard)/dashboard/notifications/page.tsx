import type { Metadata } from 'next';

import { PageHeader } from '@/components/page-header';
import { NotificationsHistory } from '@/components/notifications/notifications-history';

export const metadata: Metadata = {
  title: 'Notifikasi',
};

export default function NotificationsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Sistem"
        title="Notifikasi"
        description="Riwayat peristiwa penting di tokomu — otomatis dari aktivitas jualan, stok, dan pesanan."
      />
      <NotificationsHistory />
    </div>
  );
}
