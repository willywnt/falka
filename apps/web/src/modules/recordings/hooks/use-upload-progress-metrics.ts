'use client';

import { useRef, useState } from 'react';

import type { UploadProgressEvent } from '@/modules/storage/types';

export type UploadProgressMetrics = {
  percent: number;
  loadedBytes: number;
  totalBytes: number;
  speedBytesPerSecond: number;
  estimatedSecondsRemaining: number | null;
};

const INITIAL_METRICS: UploadProgressMetrics = {
  percent: 0,
  loadedBytes: 0,
  totalBytes: 0,
  speedBytesPerSecond: 0,
  estimatedSecondsRemaining: null,
};

export function useUploadProgressMetrics() {
  const [metrics, setMetrics] = useState<UploadProgressMetrics>(INITIAL_METRICS);
  const lastSampleRef = useRef<{ at: number; loadedBytes: number } | null>(null);

  const resetMetrics = () => {
    lastSampleRef.current = null;
    setMetrics(INITIAL_METRICS);
  };

  const handleProgress = (event: UploadProgressEvent) => {
    const now = Date.now();
    const last = lastSampleRef.current;
    let speedBytesPerSecond = 0;

    if (last && now > last.at) {
      const elapsedSeconds = (now - last.at) / 1000;
      const deltaBytes = event.loadedBytes - last.loadedBytes;
      if (elapsedSeconds > 0 && deltaBytes >= 0) {
        speedBytesPerSecond = deltaBytes / elapsedSeconds;
      }
    }

    lastSampleRef.current = { at: now, loadedBytes: event.loadedBytes };

    const remainingBytes = Math.max(0, event.totalBytes - event.loadedBytes);
    const estimatedSecondsRemaining =
      speedBytesPerSecond > 0 ? remainingBytes / speedBytesPerSecond : null;

    setMetrics({
      percent: event.percent,
      loadedBytes: event.loadedBytes,
      totalBytes: event.totalBytes,
      speedBytesPerSecond,
      estimatedSecondsRemaining,
    });
  };

  return { metrics, handleProgress, resetMetrics };
}

export function formatUploadSpeed(bytesPerSecond: number): string {
  if (bytesPerSecond <= 0) return '—';
  const mbps = (bytesPerSecond * 8) / (1024 * 1024);
  if (mbps >= 1) return `${mbps.toFixed(1)} Mbps`;
  const kbps = (bytesPerSecond * 8) / 1024;
  return `${kbps.toFixed(0)} Kbps`;
}

export function formatEta(seconds: number | null): string {
  if (seconds === null || !Number.isFinite(seconds)) return '—';
  if (seconds < 60) return `${Math.ceil(seconds)}s remaining`;
  const minutes = Math.floor(seconds / 60);
  const remainder = Math.ceil(seconds % 60);
  return `${minutes}m ${remainder}s remaining`;
}
