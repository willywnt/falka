'use client';

import { VideoOff } from 'lucide-react';

import { useCameraDevices } from '../hooks/use-camera-devices';
import { useRecordingReliabilityStore } from '../store/recording-reliability.store';
import { Button } from '@/components/ui/button';

export function WebcamDisconnectWarning() {
  const webcamDisconnected = useRecordingReliabilityStore((state) => state.webcamDisconnected);
  const { devices, showCameraPicker, switchCamera, isSwitching } = useCameraDevices();

  if (!webcamDisconnected) return null;

  return (
    <div
      role="alert"
      className="border-destructive/40 bg-destructive/10 text-destructive flex items-start gap-3 rounded-lg border px-4 py-3 text-sm"
    >
      <VideoOff className="mt-0.5 size-4 shrink-0" />
      <div className="flex-1 space-y-2">
        <p className="font-medium">Kamera terputus</p>
        <p className="opacity-90">
          Videomu aman tersimpan di perangkat ini. Buka pusat upload buat upload ulang atau buang
          rekamannya.
        </p>
        {showCameraPicker && devices.length > 1 ? (
          <div className="flex flex-wrap gap-2 pt-1">
            {devices.map((device) => (
              <Button
                key={device.deviceId}
                size="sm"
                variant="outline"
                disabled={isSwitching}
                onClick={() => void switchCamera(device.deviceId)}
              >
                Ganti ke {device.label}
              </Button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
