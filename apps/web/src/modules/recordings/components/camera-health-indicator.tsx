'use client';

import { Circle } from 'lucide-react';

import { useRecordingStore } from '../store/recording.store';
import { useRecordingReliabilityStore } from '@/modules/recordings/recovery/store/recording-reliability.store';

export function CameraHealthIndicator() {
  const mediaStream = useRecordingStore((state) => state.mediaStream);
  const status = useRecordingStore((state) => state.status);
  const webcamDisconnected = useRecordingReliabilityStore((state) => state.webcamDisconnected);

  const isActiveSession =
    status === 'RECORDING' ||
    status === 'REQUESTING_PERMISSION' ||
    status === 'UPLOADING' ||
    status === 'STOPPING';

  const hasLiveVideo = Boolean(
    mediaStream?.getVideoTracks().some((track) => track.readyState === 'live'),
  );

  const connected = isActiveSession ? hasLiveVideo && !webcamDisconnected : hasLiveVideo;

  if (!isActiveSession && !mediaStream) {
    return (
      <div className="text-muted-foreground flex items-center gap-2 text-sm">
        <Circle className="text-muted-foreground/40 size-2.5 fill-current" />
        Kamera siaga
      </div>
    );
  }

  return (
    <div
      className={`flex items-center gap-2 text-sm ${connected ? 'text-status-ok' : 'text-destructive'}`}
    >
      <Circle
        className={`size-2.5 fill-current ${connected ? 'text-status-ok' : 'text-destructive'}`}
      />
      {connected ? 'Kamera terhubung' : 'Kamera terputus'}
    </div>
  );
}
