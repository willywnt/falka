'use client';

import { useState } from 'react';
import { Check, Copy, Link2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import type { StatusTone } from '@/components/status-badge';
import { StatusBadge } from '@/components/status-badge';
import { formatDateTime } from '@/lib/formatters';

import {
  useCreateShareLinkMutation,
  useRevokeShareLinkMutation,
  useShareLinksQuery,
} from '../hooks/use-recording-share';
import type { RecordingListItem, ShareLinkItem } from '../types';
import { SHARE_LINK_TTL_OPTIONS } from '../validators/share-link';

const DEFAULT_TTL_HOURS = 168;

const STATUS_BADGE: Record<ShareLinkItem['status'], { label: string; tone: StatusTone }> = {
  active: { label: 'Aktif', tone: 'ok' },
  expired: { label: 'Kedaluwarsa', tone: 'neutral' },
  revoked: { label: 'Dicabut', tone: 'danger' },
};

function ShareDialogBody({ recordingId, noResi }: { recordingId: string; noResi: string }) {
  const [expiresInHours, setExpiresInHours] = useState<number>(DEFAULT_TTL_HOURS);
  const [createdUrl, setCreatedUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const linksQuery = useShareLinksQuery(recordingId, true);
  const createMutation = useCreateShareLinkMutation(recordingId);
  const revokeMutation = useRevokeShareLinkMutation(recordingId);

  async function handleCreate() {
    try {
      const result = await createMutation.mutateAsync(expiresInHours);
      setCreatedUrl(result.shareUrl);
      setCopied(false);
      toast.success('Link berhasil dibuat', {
        description: 'Salin sekarang, lalu tempel ke komplain.',
      });
    } catch (error) {
      toast.error('Gagal membuat link', {
        description: error instanceof Error ? error.message : 'Coba lagi.',
      });
    }
  }

  async function handleCopy() {
    if (!createdUrl) return;
    try {
      await navigator.clipboard.writeText(createdUrl);
      setCopied(true);
      toast.success('Link disalin');
    } catch {
      toast.error('Gagal menyalin — pilih dan salin link-nya manual.');
    }
  }

  async function handleRevoke(shareLinkId: string) {
    try {
      await revokeMutation.mutateAsync(shareLinkId);
      toast.success('Link dicabut');
    } catch (error) {
      toast.error('Gagal mencabut link', {
        description: error instanceof Error ? error.message : 'Coba lagi.',
      });
    }
  }

  const links = linksQuery.data ?? [];

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-muted-foreground mr-1 text-sm">Kedaluwarsa dalam</span>
          {SHARE_LINK_TTL_OPTIONS.map((option) => (
            <Button
              key={option.hours}
              type="button"
              size="sm"
              variant={expiresInHours === option.hours ? 'default' : 'outline'}
              onClick={() => setExpiresInHours(option.hours)}
            >
              {option.label}
            </Button>
          ))}
          <Button
            type="button"
            size="sm"
            className="ml-auto"
            onClick={() => void handleCreate()}
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Link2 className="size-4" />
            )}
            Buat link
          </Button>
        </div>

        {createdUrl ? (
          <div className="border-primary/30 bg-primary/5 space-y-2 rounded-lg border p-3">
            <p className="text-xs font-medium">
              Siapa pun yang pegang link ini bisa lihat video packing sampai masa berlakunya habis.
            </p>
            <div className="flex items-center gap-2">
              <Input readOnly value={createdUrl} className="h-9 font-mono text-xs" />
              <Button type="button" size="sm" variant="outline" onClick={() => void handleCopy()}>
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                {copied ? 'Tersalin' : 'Salin'}
              </Button>
            </div>
          </div>
        ) : null}
      </div>

      <div className="space-y-2">
        <p className="text-muted-foreground eyebrow">Link untuk resi {noResi}</p>
        {linksQuery.isLoading ? (
          <p className="text-muted-foreground text-sm">Memuat…</p>
        ) : links.length === 0 ? (
          <p className="text-muted-foreground text-sm">Belum ada link.</p>
        ) : (
          <ul className="divide-y rounded-lg border">
            {links.map((link) => {
              const badge = STATUS_BADGE[link.status];
              return (
                <li key={link.id} className="flex items-center justify-between gap-3 p-3 text-sm">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <StatusBadge tone={badge.tone}>{badge.label}</StatusBadge>
                      <span className="text-muted-foreground text-xs">
                        <span className="num">{link.viewCount}</span> tampilan
                      </span>
                    </div>
                    <div className="text-muted-foreground mt-1 text-xs">
                      Kedaluwarsa {formatDateTime(link.expiresAt)}
                    </div>
                  </div>
                  {link.status === 'active' ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => void handleRevoke(link.id)}
                      disabled={revokeMutation.isPending}
                    >
                      Cabut
                    </Button>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

type ShareEvidenceDialogProps = {
  recording: RecordingListItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ShareEvidenceDialog({ recording, open, onOpenChange }: ShareEvidenceDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Bagikan bukti packing</DialogTitle>
          <DialogDescription>
            Buat link video packing buat dikirim ke pembeli atau marketplace pas ada komplain.
            Pembeli bisa lihat tanpa perlu login, dan link bisa kamu atur masa berlakunya atau
            dicabut kapan aja.
          </DialogDescription>
        </DialogHeader>
        {recording ? (
          <ShareDialogBody recordingId={recording.id} noResi={recording.noResi} />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
