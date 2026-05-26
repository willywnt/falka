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
    <div className="flex items-center gap-2 font-mono text-lg tabular-nums">
      {isRecording ? (
        <span className="relative flex size-2.5">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex size-2.5 rounded-full bg-red-500" />
        </span>
      ) : null}
      <span>{formatRecordingDuration(durationSeconds)}</span>
    </div>
  );
}
