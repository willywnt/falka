'use client';

import { useState } from 'react';
import { Check, Copy, Link2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { formatDateTime } from '@/lib/formatters';
import { cn } from '@/lib/utils';

import {
  useCreateShareLinkMutation,
  useRevokeShareLinkMutation,
  useShareLinksQuery,
} from '../hooks/use-recording-share';
import type { RecordingListItem, ShareLinkItem } from '../types';
import { SHARE_LINK_TTL_OPTIONS } from '../validators/share-link';

const DEFAULT_TTL_HOURS = 168;

const STATUS_BADGE: Record<ShareLinkItem['status'], { label: string; className: string }> = {
  active: {
    label: 'Active',
    className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  },
  expired: { label: 'Expired', className: 'bg-muted text-muted-foreground' },
  revoked: { label: 'Revoked', className: 'bg-rose-500/10 text-rose-600 dark:text-rose-400' },
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
      toast.success('Share link created', {
        description: 'Copy it now — paste it into the dispute.',
      });
    } catch (error) {
      toast.error('Could not create link', {
        description: error instanceof Error ? error.message : 'Please try again.',
      });
    }
  }

  async function handleCopy() {
    if (!createdUrl) return;
    try {
      await navigator.clipboard.writeText(createdUrl);
      setCopied(true);
      toast.success('Link copied');
    } catch {
      toast.error('Copy failed — select and copy the link manually.');
    }
  }

  async function handleRevoke(shareLinkId: string) {
    try {
      await revokeMutation.mutateAsync(shareLinkId);
      toast.success('Link revoked');
    } catch (error) {
      toast.error('Could not revoke link', {
        description: error instanceof Error ? error.message : 'Please try again.',
      });
    }
  }

  const links = linksQuery.data ?? [];

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-muted-foreground mr-1 text-sm">Expires in</span>
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
            Create link
          </Button>
        </div>

        {createdUrl ? (
          <div className="border-primary/30 bg-primary/5 space-y-2 rounded-lg border p-3">
            <p className="text-xs font-medium">
              Anyone with this link can view the packing video until it expires.
            </p>
            <div className="flex items-center gap-2">
              <Input readOnly value={createdUrl} className="h-9 font-mono text-xs" />
              <Button type="button" size="sm" variant="outline" onClick={() => void handleCopy()}>
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </div>
          </div>
        ) : null}
      </div>

      <div className="space-y-2">
        <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
          Links for resi {noResi}
        </p>
        {linksQuery.isLoading ? (
          <p className="text-muted-foreground text-sm">Loading…</p>
        ) : links.length === 0 ? (
          <p className="text-muted-foreground text-sm">No share links yet.</p>
        ) : (
          <ul className="divide-y rounded-lg border">
            {links.map((link) => {
              const badge = STATUS_BADGE[link.status];
              return (
                <li key={link.id} className="flex items-center justify-between gap-3 p-3 text-sm">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge className={cn('border-transparent', badge.className)}>
                        {badge.label}
                      </Badge>
                      <span className="text-muted-foreground text-xs">
                        {link.viewCount} view{link.viewCount === 1 ? '' : 's'}
                      </span>
                    </div>
                    <div className="text-muted-foreground mt-1 text-xs">
                      Expires {formatDateTime(link.expiresAt)}
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
                      Revoke
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
          <DialogTitle>Share packing evidence</DialogTitle>
          <DialogDescription>
            Create an expiring, revocable link to the packing video — paste it into a buyer or
            marketplace dispute. No login needed to view it.
          </DialogDescription>
        </DialogHeader>
        {recording ? (
          <ShareDialogBody recordingId={recording.id} noResi={recording.noResi} />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
