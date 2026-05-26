'use client';

import type { RecordingDetail } from '../types';
import {
  formatRecordingDate,
  formatRecordingDuration,
  formatRecordingFileSize,
  getStorageProviderLabel,
} from '../utils/recording-display';
import { RecordingStatusBadge } from './recording-status-badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{recording?.noResi ?? 'Recording details'}</DialogTitle>
          <DialogDescription>Operational recording metadata</DialogDescription>
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
              <RecordingStatusBadge status={recording.status} />
            </div>

            <Separator />

            <div className="space-y-3">
              <DetailRow label="Resi number" value={recording.noResi} />
              <DetailRow label="Duration" value={formatRecordingDuration(recording.durationSeconds)} />
              <DetailRow label="File size" value={formatRecordingFileSize(recording.fileSizeBytes)} />
              <DetailRow label="Created" value={formatRecordingDate(recording.createdAt)} />
              <DetailRow
                label="Uploaded"
                value={recording.uploadedAt ? formatRecordingDate(recording.uploadedAt) : '—'}
              />
              <DetailRow
                label="Storage"
                value={getStorageProviderLabel(recording.storageProvider)}
              />
              <DetailRow label="Filename" value={recording.generatedFilename} />
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
