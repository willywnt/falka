'use client';

import { AlertTriangle } from 'lucide-react';

import { useRecordingReliabilityStore } from '../store/recording-reliability.store';

export function StaleLockWarning() {
  const staleLockCleared = useRecordingReliabilityStore((state) => state.staleLockCleared);

  if (!staleLockCleared) return null;

  return (
    <div
      role="alert"
      className="border-highlight/40 bg-highlight/15 text-status-warn flex items-start gap-3 rounded-lg border px-4 py-3 text-sm"
    >
      <AlertTriangle className="mt-0.5 size-4 shrink-0" />
      <div>
        <p className="font-medium">Kunci rekaman lama sudah dibersihkan</p>
        <p className="mt-1 opacity-90">
          Sesi rekaman sebelumnya sempat terputus. Kamu bisa mulai rekaman baru dengan aman.
        </p>
      </div>
    </div>
  );
}
