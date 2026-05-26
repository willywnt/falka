'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';

import type { RecordingListItem } from '../types';
import { useRecordingPlaybackQuery } from '../hooks/use-recordings-management';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';

type RecordingPlayerModalProps = {
  recording: RecordingListItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function RecordingPlayerModal({
  recording,
  open,
  onOpenChange,
}: RecordingPlayerModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVideoLoading, setIsVideoLoading] = useState(true);
  const [hasVideoError, setHasVideoError] = useState(false);

  const playbackQuery = useRecordingPlaybackQuery(recording?.id ?? null, open);

  useEffect(() => {
    if (!open) {
      setIsVideoLoading(true);
      setHasVideoError(false);
      videoRef.current?.pause();
    }
  }, [open]);

  useEffect(() => {
    setIsVideoLoading(true);
    setHasVideoError(false);
  }, [playbackQuery.data?.playbackUrl]);

  if (!recording) return null;

  const isLoading = playbackQuery.isLoading || (playbackQuery.isSuccess && isVideoLoading);
  const fetchError = playbackQuery.error;
  const showError = Boolean(fetchError) || hasVideoError;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl gap-0 overflow-hidden p-0">
        <DialogHeader className="space-y-1 px-6 pt-6 pb-4">
          <DialogTitle>{recording.noResi}</DialogTitle>
          <DialogDescription>WebM playback</DialogDescription>
        </DialogHeader>

        <div className="relative bg-black">
          {isLoading && !showError ? (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/70">
              <Loader2 className="size-8 animate-spin text-white" />
            </div>
          ) : null}

          {showError ? (
            <div className="flex aspect-video flex-col items-center justify-center gap-2 px-6 text-center text-sm text-white">
              <p>
                {fetchError instanceof Error
                  ? fetchError.message
                  : 'Unable to load this video. The file may be unavailable or blocked by storage access settings.'}
              </p>
              {playbackQuery.isError ? (
                <button
                  type="button"
                  className="text-primary-foreground/80 underline underline-offset-2 hover:text-white"
                  onClick={() => void playbackQuery.refetch()}
                >
                  Retry
                </button>
              ) : null}
            </div>
          ) : playbackQuery.data ? (
            <video
              ref={videoRef}
              key={playbackQuery.data.playbackUrl}
              className="aspect-video max-h-[70vh] w-full bg-black"
              controls
              playsInline
              preload="metadata"
              onLoadedData={() => setIsVideoLoading(false)}
              onError={() => {
                setIsVideoLoading(false);
                setHasVideoError(true);
              }}
            >
              <source
                src={playbackQuery.data.playbackUrl}
                type={playbackQuery.data.mimeType || 'video/webm'}
              />
            </video>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function RecordingPlayerSkeleton() {
  return <Skeleton className="aspect-video w-full rounded-lg" />;
}
