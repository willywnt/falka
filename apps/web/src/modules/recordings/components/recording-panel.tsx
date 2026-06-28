'use client';

import { AlertCircle, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';

import { RecordingReliabilityShell } from '@/modules/recordings/recovery/components/recording-reliability-shell';
import { recoverDefaultCameraPreview } from '@/modules/recordings/recovery/utils/camera-stream';
import { useAnotherTabRecording } from '@/modules/recordings/recovery/hooks/use-another-tab-recording';
import { useCameraDevices } from '@/modules/recordings/recovery/hooks/use-camera-devices';
import { useScanSoundPref } from '@/hooks/use-scan-sound-pref';
import { useSoundUnlock } from '@/hooks/use-sound-unlock';
import { unlockScanSound } from '@/lib/scan-sound';

import { useRecording } from '../hooks/use-recording';
import { useDuplicateResiWarning } from '../hooks/use-duplicate-resi-warning';
import { PackOrderPanel } from './pack-order-panel';
import { RecordingControls } from './recording-controls';
import { RecordingLifecycleStatusBadge } from './recording-lifecycle-status-badge';
import { RecordingTimer } from './recording-timer';
import { EstimatedFileSize, UploadProgressBar } from './upload-progress';
import { WebcamPreview } from './webcam-preview';
import { CameraHealthIndicator } from './camera-health-indicator';
import { LocalStorageUsageIndicator } from './local-storage-usage-indicator';
import { StorageQuotaIndicator } from '@/modules/storage/components/storage-quota-indicator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ConnectScannerDialog } from '@/modules/scanner-pairing/components/connect-scanner-dialog';
import { RecordingCountdownModal } from '@/modules/scanner-pairing/components/recording-countdown-modal';
import { ScannerStatusWidget } from '@/modules/scanner-pairing/components/scanner-status-widget';
import { useScannerAutoRecording } from '@/modules/scanner-pairing/hooks/use-scanner-auto-recording';
import { useDesktopScannerSocket } from '@/modules/scanner-pairing/hooks/use-desktop-scanner-socket';
import { useDesktopStationRecordingSync } from '@/modules/scanner-pairing/hooks/use-desktop-station-recording-sync';
import { useActivePairingQuery } from '@/modules/scanner-pairing/hooks/use-pairing-api';
import { isMobileScannerEnabled } from '@/modules/scanner-pairing/config';

export function RecordingPanel({ initialResi }: { initialResi?: string } = {}) {
  const {
    status,
    trackingNumber,
    setTrackingNumber,
    durationSeconds,
    uploadProgress,
    uploadMetrics,
    estimatedFileSizeBytes,
    mediaStream,
    error,
    completedRecording,
    isBusy,
    canStart,
    canStop,
    startRecording,
    stopRecording,
    cancelUpload,
    reset,
    retryPermission,
  } = useRecording();

  const { devices, activeDeviceId, showCameraPicker, isSwitching, switchCamera } =
    useCameraDevices();
  const anotherTabRecording = useAnotherTabRecording();
  const { duplicateWarning, checkDuplicate, clearDuplicateWarning } = useDuplicateResiWarning();

  const pendingStartRef = useRef(false);
  const [pairingDialogOpen, setPairingDialogOpen] = useState(false);

  // Prefill the resi once when arriving from an order's "Rekam di station" deep link.
  const seededResiRef = useRef(false);
  useEffect(() => {
    if (!seededResiRef.current && initialResi) {
      seededResiRef.current = true;
      setTrackingNumber(initialResi);
    }
  }, [initialResi, setTrackingNumber]);

  // Hidden in production until the realtime socket host is deployed.
  const scannerEnabled = isMobileScannerEnabled();
  // First interaction unlocks audio so the scan beep + countdown ticks can play.
  useSoundUnlock(scannerEnabled);
  const { soundOn, toggleSound } = useScanSoundPref('palka-recording-scan-sound');
  const { data: activePairing } = useActivePairingQuery(scannerEnabled);
  // Only act on a phone paired for RECORDING — a POS pairing must not auto-record.
  const pairingSession =
    scannerEnabled && activePairing?.session?.purpose === 'RECORDING'
      ? activePairing.session
      : null;

  const openScanner = () => {
    unlockScanSound();
    setPairingDialogOpen(true);
  };

  const {
    handleBarcodeScanned,
    cancelCountdown,
    startCountdownNow,
    scannerDuplicateWarning,
    clearScannerDuplicateWarning,
    confirmScannerDuplicateAndCountdown,
  } = useScannerAutoRecording({
    setTrackingNumber,
    startRecording,
    canStart: canStart && !anotherTabRecording,
    soundEnabled: soundOn,
  });

  useDesktopScannerSocket(pairingSession?.id ?? null, handleBarcodeScanned);
  useDesktopStationRecordingSync(pairingSession?.id ?? null);

  useEffect(() => {
    void recoverDefaultCameraPreview();
  }, []);

  const runStartRecording = useCallback(async () => {
    const trimmedTrackingNumber = trackingNumber.trim();

    if (!trimmedTrackingNumber) {
      await startRecording();
      return;
    }

    const isDuplicate = await checkDuplicate(trimmedTrackingNumber);
    if (isDuplicate) {
      pendingStartRef.current = true;
      return;
    }

    await startRecording();
  }, [checkDuplicate, trackingNumber, startRecording]);

  const isRecording = status === 'RECORDING';
  const isPermissionDenied = error?.toLowerCase().includes('permission');

  return (
    <RecordingReliabilityShell>
      <div className="space-y-4">
        <StorageQuotaIndicator variant="warning-only" />
        <LocalStorageUsageIndicator />

        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
            <div>
              <CardTitle>Rekaman webcam</CardTitle>
              <CardDescription>
                Masukkan no. resi, lalu rekam dan upload ke penyimpanan.
              </CardDescription>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {scannerEnabled ? (
                <ScannerStatusWidget
                  onConnectClick={openScanner}
                  soundOn={soundOn}
                  onToggleSound={toggleSound}
                />
              ) : null}
              <RecordingLifecycleStatusBadge status={status} />
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <CameraHealthIndicator />

            {anotherTabRecording ? (
              <div className="border-highlight/40 bg-highlight/15 text-status-warn rounded-lg border px-4 py-3 text-sm">
                Lagi ada rekaman aktif di tab lain. Tutup tab itu dulu atau tunggu sampai selesai
                sebelum mulai rekam di sini.
              </div>
            ) : null}

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
              <WebcamPreview stream={mediaStream} isRecording={isRecording} />

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="trackingNumber">No. resi</Label>
                  <Input
                    id="trackingNumber"
                    placeholder="Masukkan no. resi"
                    value={trackingNumber}
                    onChange={(event) => setTrackingNumber(event.target.value)}
                    disabled={isBusy}
                    autoComplete="off"
                  />
                </div>

                <PackOrderPanel trackingNumber={trackingNumber} />

                {showCameraPicker ? (
                  <div className="space-y-2">
                    <Label>Kamera</Label>
                    <div className="flex flex-wrap gap-2">
                      {devices.map((device) => (
                        <Button
                          key={device.deviceId}
                          type="button"
                          variant={device.deviceId === activeDeviceId ? 'default' : 'outline'}
                          size="sm"
                          disabled={isSwitching}
                          onClick={() => void switchCamera(device.deviceId)}
                        >
                          {device.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                ) : null}

                <RecordingTimer durationSeconds={durationSeconds} isRecording={isRecording} />
                <EstimatedFileSize bytes={estimatedFileSizeBytes} />

                {status === 'UPLOADING' ? (
                  <UploadProgressBar
                    progress={uploadProgress}
                    label="Mengupload rekaman"
                    metrics={uploadMetrics}
                  />
                ) : null}

                {error ? (
                  <div className="border-destructive/30 bg-destructive/5 text-destructive flex gap-3 rounded-lg border p-3 text-sm">
                    <AlertCircle className="mt-0.5 size-4 shrink-0" />
                    <div>
                      <p className="font-medium">{error}</p>
                      {isPermissionDenied ? (
                        <p className="mt-1">
                          Cek izin kamera di browser, lalu klik Coba lagi kamera.
                        </p>
                      ) : null}
                    </div>
                  </div>
                ) : null}

                {completedRecording ? (
                  <div className="border-primary/30 bg-primary/5 flex gap-3 rounded-lg border p-3 text-sm">
                    <CheckCircle2 className="text-primary mt-0.5 size-4 shrink-0" />
                    <div>
                      <p className="font-medium">
                        Rekaman tersimpan untuk {completedRecording.trackingNumber}
                      </p>
                      <Button variant="link" className="h-auto p-0" asChild>
                        <Link
                          href={`/dashboard/recordings?search=${encodeURIComponent(completedRecording.trackingNumber)}`}
                        >
                          Lihat di daftar rekaman
                        </Link>
                      </Button>
                    </div>
                  </div>
                ) : null}

                <RecordingControls
                  canStart={canStart && !anotherTabRecording}
                  canStop={canStop}
                  isBusy={isBusy}
                  status={status}
                  onStart={() => void runStartRecording()}
                  onStop={() => void stopRecording()}
                  onReset={() => void reset()}
                  onRetryPermission={() => void retryPermission()}
                  onCancelUpload={cancelUpload}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {scannerEnabled ? (
        <>
          <ConnectScannerDialog open={pairingDialogOpen} onOpenChange={setPairingDialogOpen} />
          <RecordingCountdownModal onCancel={cancelCountdown} onStartNow={startCountdownNow} />
        </>
      ) : null}

      <AlertDialog
        open={Boolean(scannerDuplicateWarning)}
        onOpenChange={(open) => !open && clearScannerDuplicateWarning()}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Resi ini baru saja direkam</AlertDialogTitle>
            <AlertDialogDescription>
              {scannerDuplicateWarning ? (
                <>
                  No. resi{' '}
                  <span className="num font-medium">{scannerDuplicateWarning.trackingNumber}</span>{' '}
                  dari hasil scan sudah direkam dalam 24 jam terakhir. Tetap mulai rekam?
                </>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={clearScannerDuplicateWarning}>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmScannerDuplicateAndCountdown}>
              Tetap rekam
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={Boolean(duplicateWarning)}
        onOpenChange={(open) => !open && clearDuplicateWarning()}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Resi ini baru saja direkam</AlertDialogTitle>
            <AlertDialogDescription>
              {duplicateWarning ? (
                <>
                  No. resi{' '}
                  <span className="num font-medium">{duplicateWarning.trackingNumber}</span> yang
                  kamu masukkan sudah direkam dalam 24 jam terakhir. Tetap mulai rekam?
                </>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={clearDuplicateWarning}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                clearDuplicateWarning();
                if (pendingStartRef.current) {
                  pendingStartRef.current = false;
                  void startRecording();
                }
              }}
            >
              Tetap rekam
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </RecordingReliabilityShell>
  );
}
