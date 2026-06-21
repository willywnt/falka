'use client';

import { useState } from 'react';
import { BellRing } from 'lucide-react';
import { toast } from 'sonner';

import { ErrorState } from '@/components/error-state';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { NOTIFICATION_CATEGORIES } from '@/modules/notifications/notification-categories';
import {
  useNotificationPreferencesQuery,
  useSetNotificationPreferenceMutation,
} from '@/modules/notifications/hooks/use-notifications-data';
import { useHasPermission } from '@/modules/users/hooks/use-org';
import type { NotificationCategory } from '@prisma/client';

const REQUIRES_BY_CATEGORY = new Map(
  NOTIFICATION_CATEGORIES.map((meta) => [meta.category, meta.requires]),
);

/** "Notifikasi" tab body — each member mutes/unmutes notification categories in their own tray. */
export function NotificationSettings() {
  const { data, isLoading, error, refetch } = useNotificationPreferencesQuery();
  const setMutation = useSetNotificationPreferenceMutation();
  const [pending, setPending] = useState<NotificationCategory | null>(null);

  // Mirror the RBAC tray hiding: don't offer a toggle for a section the member can't see.
  const { allowed: canPurchasing } = useHasPermission('purchasing.view');
  const { allowed: canMarketplace } = useHasPermission('marketplace.view');

  function isVisible(category: NotificationCategory): boolean {
    const requires = REQUIRES_BY_CATEGORY.get(category) ?? null;
    if (requires === 'purchasing.view') return canPurchasing;
    if (requires === 'marketplace.view') return canMarketplace;
    return true;
  }

  async function handleToggle(category: NotificationCategory, enabled: boolean) {
    setPending(category);
    try {
      await setMutation.mutateAsync({ category, enabled });
    } catch (err) {
      toast.error('Gagal menyimpan preferensi', {
        description: err instanceof Error ? err.message : 'Terjadi kesalahan',
      });
    } finally {
      setPending(null);
    }
  }

  if (error) {
    return (
      <ErrorState
        title="Gagal memuat preferensi notifikasi"
        description={error instanceof Error ? error.message : undefined}
        onRetry={() => void refetch()}
      />
    );
  }

  if (isLoading || !data) {
    return <Skeleton className="h-72 w-full" />;
  }

  const visible = data.filter((pref) => isVisible(pref.category));

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <p className="eyebrow text-muted-foreground">Notifikasi</p>
        <p className="text-muted-foreground text-sm">
          Pilih jenis notifikasi yang mau muncul di lonceng kamu. Mematikan satu kategori cuma
          memengaruhi tray kamu sendiri, bukan anggota tim lain.
        </p>
      </div>

      <div className="divide-y rounded-xl border">
        {visible.map((pref) => (
          <div key={pref.category} className="flex items-center justify-between gap-4 p-4">
            <div className="flex min-w-0 items-start gap-3">
              <BellRing aria-hidden className="text-muted-foreground mt-0.5 size-4 shrink-0" />
              <div className="min-w-0">
                <p className="font-medium">{pref.label}</p>
                <p className="text-muted-foreground text-xs">{pref.description}</p>
              </div>
            </div>
            <Switch
              checked={pref.enabled}
              disabled={pending === pref.category}
              onCheckedChange={(value) => void handleToggle(pref.category, value)}
              aria-label={`Notifikasi ${pref.label}`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
