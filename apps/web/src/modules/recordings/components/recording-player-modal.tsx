'use client';

import { useEffect, useState } from 'react';

import type { RecordingListItem } from '../types';
import { useRecordingPlaybackQuery } from '../hooks/use-recordings-management';
import { mapServerStatusToOperational } from '../types/operational-recording-status';
import { RecordingPreviewShell, type RecordingPreviewMeta } from './recording-preview-shell';

type RecordingPlayerModalProps = {
  recording: RecordingListItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function RecordingPlayerModal({ recording, open, onOpenChange }: RecordingPlayerModalProps) {
  const [hasVideoError, setHasVideoError] = useState(false);
  const playbackQuery = useRecordingPlaybackQuery(recording?.id ?? null, open);

  useEffect(() => {
    if (!open) setHasVideoError(false);
  }, [open]);

  useEffect(() => {
    setHasVideoError(false);
  }, [playbackQuery.data?.playbackUrl]);

  const meta: RecordingPreviewMeta | null = recording
    ? {
        noResi: recording.noResi,
        status: mapServerStatusToOperational(recording.status),
        durationSeconds: recording.durationSeconds,
        fileSizeBytes: recording.fileSizeBytes,
        recordedAt: recording.createdAt,
        uploadedAt: recording.uploadedAt,
      }
    : null;

  const fetchError =
    playbackQuery.error instanceof Error
      ? playbackQuery.error.message
      : hasVideoError
        ? 'Unable to load this video. Try again or download the file.'
        : null;

  return (
    <RecordingPreviewShell
      open={open}
      onOpenChange={onOpenChange}
      meta={meta}
      videoSrc={playbackQuery.data?.playbackUrl ?? null}
      videoKey={playbackQuery.data?.playbackUrl}
      mimeType={playbackQuery.data?.mimeType ?? recording?.mimeType}
      isLoading={playbackQuery.isLoading}
      errorMessage={fetchError}
      onRetry={() => void playbackQuery.refetch()}
    />
  );
}
