'use client';

import { useState } from 'react';
import { Plus, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';

import { EmptyState } from '@/components/empty-state';

import type { MarketplaceConnectionListItem } from '../types';
import {
  useDisconnectMarketplaceMutation,
  useMarketplaceConnectionsQuery,
} from '../hooks/use-marketplace-connections';
import { AddMarketplaceModal } from './add-marketplace-modal';
import { DisconnectMarketplaceDialog } from './disconnect-marketplace-dialog';
import { MarketplaceTable } from './marketplace-table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export function MarketplaceDashboard() {
  const [addOpen, setAddOpen] = useState(false);
  const [disconnectTarget, setDisconnectTarget] = useState<MarketplaceConnectionListItem | null>(
    null,
  );

  const { data, isLoading, error } = useMarketplaceConnectionsQuery();
  const disconnectMutation = useDisconnectMarketplaceMutation();

  async function handleDisconnectConfirm() {
    if (!disconnectTarget) return;

    try {
      await disconnectMutation.mutateAsync(disconnectTarget.id);
      toast.success('Koneksi marketplace diputus', {
        description: `${disconnectTarget.shopName} sudah dinonaktifkan.`,
      });
      setDisconnectTarget(null);
    } catch (disconnectError) {
      toast.error('Gagal memutuskan koneksi', {
        description:
          disconnectError instanceof Error ? disconnectError.message : 'Terjadi kesalahan',
      });
    }
  }

  const activeCount = data?.filter((item) => item.isActive).length ?? 0;
  const isEmpty = !isLoading && (data?.length ?? 0) === 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-muted-foreground text-sm">
            {isLoading
              ? 'Memuat toko terhubung...'
              : `${activeCount} toko aktif · ${data?.length ?? 0} total`}
          </p>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="size-4" />
          Hubungkan toko
        </Button>
      </div>

      {error ? (
        <div className="border-destructive/30 bg-destructive/5 text-destructive rounded-lg border p-4 text-sm">
          Gagal memuat koneksi marketplace.{' '}
          {error instanceof Error ? error.message : 'Silakan coba lagi.'}
        </div>
      ) : null}

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-12 w-full" />
          ))}
        </div>
      ) : isEmpty ? (
        <EmptyState
          icon={ShoppingBag}
          title="Belum ada toko marketplace terhubung"
          description="Hubungkan toko Shopee atau Tokopedia biar stok dan pesanannya bisa di-sync."
        />
      ) : (
        <MarketplaceTable
          connections={data ?? []}
          onDisconnect={setDisconnectTarget}
          isDisconnecting={disconnectMutation.isPending}
        />
      )}

      <AddMarketplaceModal open={addOpen} onOpenChange={setAddOpen} />

      <DisconnectMarketplaceDialog
        connection={disconnectTarget}
        open={Boolean(disconnectTarget)}
        onOpenChange={(open) => {
          if (!open) setDisconnectTarget(null);
        }}
        onConfirm={() => void handleDisconnectConfirm()}
        isDisconnecting={disconnectMutation.isPending}
      />
    </div>
  );
}
