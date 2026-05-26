'use client';

import { Loader2, RotateCcw, Square, Video } from 'lucide-react';

import { Button } from '@/components/ui/button';

type RecordingControlsProps = {
  canStart: boolean;
  canStop: boolean;
  isBusy: boolean;
  status: string;
  onStart: () => void;
  onStop: () => void;
  onReset: () => void;
  onRetryPermission: () => void;
  onCancelUpload: () => void;
};

export function RecordingControls({
  canStart,
  canStop,
  isBusy,
  status,
  onStart,
  onStop,
  onReset,
  onRetryPermission,
  onCancelUpload,
}: RecordingControlsProps) {
  const isUploading = status === 'UPLOADING';
  const isFailed = status === 'FAILED';
  const isCompleted = status === 'COMPLETED';

  return (
    <div className="flex flex-wrap gap-3">
      <Button onClick={onStart} disabled={!canStart || isBusy} className="min-w-36">
        {status === 'REQUESTING_PERMISSION' ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Requesting access...
          </>
        ) : (
          <>
            <Video className="size-4" />
            Start recording
          </>
        )}
      </Button>

      <Button
        variant="destructive"
        onClick={onStop}
        disabled={!canStop || status === 'STOPPING'}
        className="min-w-36"
      >
        {status === 'STOPPING' ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Stopping...
          </>
        ) : (
          <>
            <Square className="size-4" />
            Stop recording
          </>
        )}
      </Button>

      {isUploading ? (
        <Button variant="outline" onClick={onCancelUpload}>
          Cancel upload
        </Button>
      ) : null}

      {isFailed ? (
        <Button variant="outline" onClick={onRetryPermission}>
          <RotateCcw className="size-4" />
          Retry
        </Button>
      ) : null}

      {(isFailed || isCompleted) && !isBusy ? (
        <Button variant="ghost" onClick={onReset}>
          New recording
        </Button>
      ) : null}
    </div>
  );
}
