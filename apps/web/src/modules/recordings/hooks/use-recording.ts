'use client';

import { useCallback, useEffect, useRef } from 'react';
import { toast } from 'sonner';

import { uploadFile } from '@/modules/storage/utils/upload-file';

import { RecordingError } from '../errors/recording-errors';
import {
  useCancelRecordingMutation,
  useMarkUploadingMutation,
  useSaveRecordingMetadataMutation,
  useStartRecordingMutation,
} from './use-recording-api';
import { useBeforeUnloadProtection } from './use-before-unload';
import { releaseRecordingLock, tryAcquireRecordingLock, useTabLockProtection } from './use-tab-lock';
import { recordingService } from '../services/recording.service';
import { useRecordingStore } from '../store/recording.store';
import { estimateRecordingFileSizeBytes } from '../utils/media-recorder';
import { noResiSchema } from '../validators/no-resi';

export function useRecording() {
  const timerRef = useRef<number | null>(null);
  const abortUploadRef = useRef<AbortController | null>(null);

  const status = useRecordingStore((state) => state.status);
  const noResi = useRecordingStore((state) => state.noResi);
  const activeRecording = useRecordingStore((state) => state.activeRecording);
  const durationSeconds = useRecordingStore((state) => state.durationSeconds);
  const uploadProgress = useRecordingStore((state) => state.uploadProgress);
  const estimatedFileSizeBytes = useRecordingStore((state) => state.estimatedFileSizeBytes);
  const mediaStream = useRecordingStore((state) => state.mediaStream);
  const error = useRecordingStore((state) => state.error);
  const completedRecording = useRecordingStore((state) => state.completedRecording);

  const setStatus = useRecordingStore((state) => state.setStatus);
  const setNoResi = useRecordingStore((state) => state.setNoResi);
  const setActiveRecording = useRecordingStore((state) => state.setActiveRecording);
  const setDurationSeconds = useRecordingStore((state) => state.setDurationSeconds);
  const setUploadProgress = useRecordingStore((state) => state.setUploadProgress);
  const setEstimatedFileSizeBytes = useRecordingStore((state) => state.setEstimatedFileSizeBytes);
  const setMediaStream = useRecordingStore((state) => state.setMediaStream);
  const setError = useRecordingStore((state) => state.setError);
  const setCompletedRecording = useRecordingStore((state) => state.setCompletedRecording);
  const resetStore = useRecordingStore((state) => state.reset);

  const startRecordingMutation = useStartRecordingMutation();
  const markUploadingMutation = useMarkUploadingMutation();
  const saveMetadataMutation = useSaveRecordingMetadataMutation();
  const cancelRecordingMutation = useCancelRecordingMutation();

  useBeforeUnloadProtection();
  useTabLockProtection();

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const handleFailure = useCallback(
    async (recordingError: RecordingError, recordingId?: string) => {
      setStatus('FAILED');
      setError(recordingError.message, recordingError.code);
      clearTimer();
      recordingService.cleanup();
      setMediaStream(null);
      releaseRecordingLock();

      if (recordingId) {
        try {
          await cancelRecordingMutation.mutateAsync(recordingId);
        } catch {
          // Ignore cleanup failures.
        }
      }

      toast.error('Recording failed', { description: recordingError.message });
    },
    [cancelRecordingMutation, clearTimer, setError, setMediaStream, setStatus],
  );

  const handleWebcamDisconnect = useCallback(async () => {
    if (status !== 'RECORDING') return;
    await handleFailure(RecordingError.recordingInterrupted(), activeRecording?.id);
  }, [activeRecording?.id, handleFailure, status]);

  const startTimer = useCallback(() => {
    clearTimer();
    timerRef.current = window.setInterval(() => {
      const nextDuration = useRecordingStore.getState().durationSeconds + 1;
      setDurationSeconds(nextDuration);
      setEstimatedFileSizeBytes(estimateRecordingFileSizeBytes(nextDuration));
    }, 1000);
  }, [clearTimer, setDurationSeconds, setEstimatedFileSizeBytes]);

  const startRecording = useCallback(async () => {
    const parsedNoResi = noResiSchema.safeParse(noResi);

    if (!parsedNoResi.success) {
      setError(parsedNoResi.error.errors[0]?.message ?? 'Invalid resi number', 'VALIDATION_ERROR');
      return;
    }

    if (!tryAcquireRecordingLock()) {
      await handleFailure(RecordingError.tabLockConflict());
      return;
    }

    setError(null);
    setCompletedRecording(null);
    setUploadProgress(0);
    setDurationSeconds(0);
    setEstimatedFileSizeBytes(0);
    setStatus('REQUESTING_PERMISSION');

    try {
      const started = await startRecordingMutation.mutateAsync(parsedNoResi.data);
      setActiveRecording({
        id: started.recordingId,
        noResi: started.noResi,
        startedAt: started.startedAt,
      });

      const stream = await recordingService.requestStream();
      setMediaStream(stream);

      recordingService.startRecording(stream, () => {
        void handleWebcamDisconnect();
      });

      setStatus('RECORDING');
      startTimer();
      toast.success('Recording started');
    } catch (unknownError) {
      releaseRecordingLock();
      recordingService.cleanup();
      setMediaStream(null);

      const recordingError = RecordingError.fromUnknown(unknownError);
      await handleFailure(recordingError, useRecordingStore.getState().activeRecording?.id);
    }
  }, [
    handleFailure,
    handleWebcamDisconnect,
    noResi,
    setActiveRecording,
    setCompletedRecording,
    setDurationSeconds,
    setError,
    setEstimatedFileSizeBytes,
    setMediaStream,
    setStatus,
    setUploadProgress,
    startRecordingMutation,
    startTimer,
  ]);

  const stopRecording = useCallback(async () => {
    if (status !== 'RECORDING' || !activeRecording) return;

    setStatus('STOPPING');
    clearTimer();

    const recordingId = activeRecording.id;

    try {
      const { blob, mimeType } = await recordingService.stopRecording();

      if (blob.size === 0) {
        throw RecordingError.recordingInterrupted();
      }

      recordingService.cleanup();
      setMediaStream(null);

      const file = recordingService.createUploadFile(blob, `recording-${Date.now()}.webm`);

      setStatus('UPLOADING');
      setUploadProgress(0);

      await markUploadingMutation.mutateAsync(recordingId);

      abortUploadRef.current = new AbortController();

      const uploadResult = await uploadFile({
        file,
        signal: abortUploadRef.current.signal,
        onProgress: ({ percent }) => setUploadProgress(percent),
      });

      const saved = await saveMetadataMutation.mutateAsync({
        recordingId,
        noResi: activeRecording.noResi,
        storageKey: uploadResult.storageKey,
        publicUrl: uploadResult.publicUrl,
        fileSizeBytes: file.size,
        durationSeconds: useRecordingStore.getState().durationSeconds,
        mimeType,
      });

      setCompletedRecording({
        id: saved.id,
        noResi: saved.noResi,
        publicUrl: saved.publicUrl,
        storageKey: saved.storageKey,
        fileSizeBytes: saved.fileSizeBytes,
        durationSeconds: saved.durationSeconds,
      });
      setStatus('COMPLETED');
      releaseRecordingLock();
      toast.success('Recording uploaded successfully');
    } catch (unknownError) {
      if (unknownError instanceof DOMException && unknownError.name === 'AbortError') {
        await handleFailure(RecordingError.uploadFailed('Upload cancelled.'), recordingId);
        return;
      }

      const message = unknownError instanceof Error ? unknownError.message : 'Upload failed';
      if (message.toLowerCase().includes('quota')) {
        await handleFailure(RecordingError.quotaExceeded(), recordingId);
        return;
      }

      await handleFailure(RecordingError.uploadFailed(message), recordingId);
    } finally {
      abortUploadRef.current = null;
    }
  }, [
    activeRecording,
    clearTimer,
    handleFailure,
    markUploadingMutation,
    saveMetadataMutation,
    setCompletedRecording,
    setMediaStream,
    setStatus,
    setUploadProgress,
    status,
  ]);

  const cancelUpload = useCallback(() => {
    abortUploadRef.current?.abort();
  }, []);

  const reset = useCallback(async () => {
    clearTimer();
    cancelUpload();
    recordingService.cleanup();
    releaseRecordingLock();
    setMediaStream(null);

    const recordingId = useRecordingStore.getState().activeRecording?.id;
    if (recordingId) {
      try {
        await cancelRecordingMutation.mutateAsync(recordingId);
      } catch {
        // Ignore cleanup failures.
      }
    }

    resetStore();
  }, [cancelRecordingMutation, cancelUpload, clearTimer, resetStore, setMediaStream]);

  const retryPermission = useCallback(async () => {
    await reset();
    await startRecording();
  }, [reset, startRecording]);

  useEffect(() => {
    return () => {
      clearTimer();
      recordingService.cleanup();
      releaseRecordingLock();
    };
  }, [clearTimer]);

  return {
    status,
    noResi,
    setNoResi,
    activeRecording,
    durationSeconds,
    uploadProgress,
    estimatedFileSizeBytes,
    mediaStream,
    error,
    completedRecording,
    isBusy: status === 'REQUESTING_PERMISSION' || status === 'RECORDING' || status === 'STOPPING' || status === 'UPLOADING',
    canStart: status === 'IDLE' || status === 'FAILED' || status === 'COMPLETED',
    canStop: status === 'RECORDING',
    startRecording,
    stopRecording,
    cancelUpload,
    reset,
    retryPermission,
  };
}
