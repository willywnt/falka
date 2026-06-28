'use client';

import Link from 'next/link';

import { useOrderByResiQuery } from '@/modules/orders/hooks/use-orders';

import type { RecordingDetail } from '../types';
import {
  formatRecordingDate,
  formatRecordingDuration,
  formatRecordingFileSize,
} from '../utils/recording-display';
import { getRecordingFailureDetail } from '../utils/recording-failure';
import { OperationalStatusBadge } from './operational-status-badge';
import { mapServerStatusToOperational } from '../types/operational-recording-status';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

function DetailRow({
  label,
  value,
  numeric = false,
}: {
  label: string;
  value: string;
  numeric?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn('max-w-[60%] text-right font-medium', numeric && 'num')}>{value}</span>
    </div>
  );
}

export function RecordingDetailModal({
  recording,
  open,
  onOpenChange,
  isLoading,
}: {
  recording: RecordingDetail | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isLoading?: boolean;
}) {
  const failureDetail = recording
    ? getRecordingFailureDetail(recording.failureCode, recording.failureReason)
    : null;

  // Reverse link: the order this packing video belongs to (matched by resi).
  const { data: linkedOrder } = useOrderByResiQuery(recording?.trackingNumber ?? null, open);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{recording?.trackingNumber ?? 'Detail rekaman'}</DialogTitle>
          <DialogDescription>Detail video packing</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
          </div>
        ) : recording ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">Status</span>
              <OperationalStatusBadge status={mapServerStatusToOperational(recording.status)} />
            </div>

            <Separator />

            <div className="space-y-3">
              <DetailRow label="No. resi" value={recording.trackingNumber} numeric />
              {linkedOrder ? (
                <div className="flex items-start justify-between gap-4 text-sm">
                  <span className="text-muted-foreground">Pesanan terkait</span>
                  <Link
                    href={`/dashboard/orders/${linkedOrder.id}`}
                    onClick={() => onOpenChange(false)}
                    className="text-primary max-w-[60%] text-right font-medium hover:underline"
                  >
                    {linkedOrder.externalOrderId} →
                  </Link>
                </div>
              ) : null}
              <DetailRow
                label="Durasi"
                value={formatRecordingDuration(recording.durationSeconds)}
                numeric
              />
              <DetailRow
                label="Ukuran file"
                value={formatRecordingFileSize(recording.fileSizeBytes)}
                numeric
              />
              <DetailRow label="Dibuat" value={formatRecordingDate(recording.createdAt)} />
              <DetailRow
                label="Diupload"
                value={
                  recording.uploadedAt
                    ? formatRecordingDate(recording.uploadedAt)
                    : 'Belum diupload'
                }
              />
              <DetailRow
                label="Status upload"
                value={
                  recording.uploadedAt
                    ? 'Sudah masuk penyimpanan'
                    : recording.status === 'FAILED'
                      ? 'Gagal'
                      : 'Lagi berlangsung'
                }
              />
              {failureDetail ? <DetailRow label="Penyebab gagal" value={failureDetail} /> : null}
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
