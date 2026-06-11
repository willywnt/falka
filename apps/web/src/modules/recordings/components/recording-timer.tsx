'use client';

import { formatRecordingDuration } from '../utils/format';

export function RecordingTimer({
  durationSeconds,
  isRecording,
}: {
  durationSeconds: number;
  isRecording: boolean;
}) {
  return (
    <div className="num flex items-center gap-2 font-mono text-lg">
      {isRecording ? (
        <span className="relative flex size-2.5">
          <span className="bg-destructive absolute inline-flex size-full animate-ping rounded-full opacity-75" />
          <span className="bg-destructive relative inline-flex size-2.5 rounded-full" />
        </span>
      ) : null}
      <span>{formatRecordingDuration(durationSeconds)}</span>
    </div>
  );
}
