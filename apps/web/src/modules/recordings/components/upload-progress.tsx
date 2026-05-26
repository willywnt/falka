'use client';

import { formatEstimatedFileSize } from '../utils/format';

export function UploadProgressBar({
  progress,
  label = 'Uploading recording',
}: {
  progress: number;
  label?: string;
}) {
  const safeProgress = Math.max(0, Math.min(100, progress));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium tabular-nums">{safeProgress}%</span>
      </div>
      <div className="bg-muted h-2 overflow-hidden rounded-full">
        <div
          className="bg-primary h-full transition-all duration-200"
          style={{ width: `${safeProgress}%` }}
        />
      </div>
    </div>
  );
}

export function EstimatedFileSize({ bytes }: { bytes: number }) {
  return (
    <p className="text-muted-foreground text-sm">
      Estimated size: <span className="text-foreground font-medium">{formatEstimatedFileSize(bytes)}</span>
    </p>
  );
}
