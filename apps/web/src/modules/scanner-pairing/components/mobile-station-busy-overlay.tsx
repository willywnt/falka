'use client';

import type { ReactNode } from 'react';
import { CircleDot, Loader2, Upload } from 'lucide-react';

import type { StationRecordingPhase } from '../socket/events';

const PHASE_COPY: Record<
  Exclude<StationRecordingPhase, 'idle'>,
  { title: string; description: string; icon: ReactNode }
> = {
  countdown: {
    title: 'Starting recording',
    description: 'Desktop is counting down — hold the phone steady.',
    icon: <Loader2 className="size-8 animate-spin text-amber-400" />,
  },
  recording: {
    title: 'Recording in progress',
    description: 'Finish packing on the station. Scanning is paused until recording ends.',
    icon: <CircleDot className="size-8 animate-pulse text-red-500" />,
  },
  uploading: {
    title: 'Uploading recording',
    description: 'Wait for the upload on desktop before scanning the next resi.',
    icon: <Upload className="size-8 text-sky-400" />,
  },
};

type MobileStationBusyOverlayProps = {
  phase: Exclude<StationRecordingPhase, 'idle'>;
  barcode: string | null;
};

export function MobileStationBusyOverlay({ phase, barcode }: MobileStationBusyOverlayProps) {
  const copy = PHASE_COPY[phase];

  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-black/85 px-6 text-center text-white">
      {copy.icon}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">{copy.title}</h2>
        <p className="text-sm text-white/80">{copy.description}</p>
        {barcode ? (
          <p className="font-mono text-base font-semibold tracking-wide text-white">{barcode}</p>
        ) : null}
      </div>
      <p className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium">Scanner paused</p>
    </div>
  );
}
