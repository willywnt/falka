'use client';

import { useState } from 'react';
import { Archive, ChevronDown, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

import { ActionTooltip } from '@/components/ui/action-tooltip';
import { Button } from '@/components/ui/button';
import { ErrorState } from '@/components/error-state';
import { formatRelativeTime } from '@/lib/formatters';
import { cn } from '@/lib/utils';

import { useArchivedBundlesQuery, useRestoreBundleMutation } from '../hooks/use-bundles';
import type { ArchivedBundleItem } from '../types';
import { BundleImage } from './bundle-image';

/**
 * The user's archived bundles, collapsed by default. Each can be restored — which
 * reinstates its original SKU — unless that SKU is taken by a live variant or bundle,
 * in which case the action is disabled with the reason in a tooltip. A bundle with 0
 * components was auto-archived after its last component variant was deleted; it comes
 * back empty and needs components re-added. Renders nothing while loading or empty.
 */
export function ArchivedBundles() {
  const { data, isLoading, error, refetch } = useArchivedBundlesQuery();
  const restore = useRestoreBundleMutation();
  const [open, setOpen] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  async function handleRestore(bundle: ArchivedBundleItem) {
    setRestoringId(bundle.id);
    try {
      await restore.mutateAsync(bundle.id);
      toast.success('Dipulihkan', { description: `${bundle.name} kembali aktif.` });
    } catch (err) {
      toast.error('Gagal memulihkan', {
        description: err instanceof Error ? err.message : 'Terjadi kesalahan',
      });
    } finally {
      setRestoringId(null);
    }
  }

  if (error) {
    return (
      <ErrorState
        title="Gagal memuat bundel terarsip"
        onRetry={() => void refetch()}
        className="p-6"
      />
    );
  }

  if (isLoading || !data || data.length === 0) return null;

  return (
    <div className="rounded-xl border">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left text-sm font-medium"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2">
          <Archive className="text-muted-foreground size-4" />
          Bundel terarsip <span className="text-muted-foreground">· {data.length}</span>
        </span>
        <ChevronDown
          className={cn('text-muted-foreground size-4 transition-transform', open && 'rotate-180')}
        />
      </button>
      {open ? (
        <ul className="divide-y border-t">
          {data.map((bundle) => (
            <li key={bundle.id} className="flex items-center gap-3 px-4 py-3">
              <BundleImage bundleId={bundle.id} imageUrl={bundle.imageUrl} label={bundle.name} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{bundle.name}</p>
                <p className="text-muted-foreground truncate text-xs">
                  {bundle.sku} ·{' '}
                  {bundle.componentCount > 0
                    ? `${bundle.componentCount} komponen`
                    : 'tanpa komponen'}{' '}
                  · diarsipkan {formatRelativeTime(bundle.deletedAt)}
                </p>
              </div>
              {bundle.restorable ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void handleRestore(bundle)}
                  disabled={restore.isPending}
                >
                  <RotateCcw className="size-4" />
                  {restoringId === bundle.id ? 'Memulihkan…' : 'Pulihkan'}
                </Button>
              ) : (
                <ActionTooltip label={bundle.blockReason ?? 'Tidak bisa dipulihkan.'}>
                  <span tabIndex={0} className="inline-flex rounded-md">
                    <Button variant="outline" size="sm" disabled>
                      <RotateCcw className="size-4" />
                      Pulihkan
                    </Button>
                  </span>
                </ActionTooltip>
              )}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
