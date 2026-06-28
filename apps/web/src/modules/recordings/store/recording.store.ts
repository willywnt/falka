import { create } from 'zustand';

import type {
  ActiveRecordingSession,
  CompletedRecordingSummary,
  RecordingLifecycleStatus,
} from '../types';

type RecordingStoreState = {
  status: RecordingLifecycleStatus;
  trackingNumber: string;
  activeRecording: ActiveRecordingSession | null;
  durationSeconds: number;
  uploadProgress: number;
  estimatedFileSizeBytes: number;
  mediaStream: MediaStream | null;
  error: string | null;
  errorCode: string | null;
  completedRecording: CompletedRecordingSummary | null;
};

type RecordingStoreActions = {
  setStatus: (status: RecordingLifecycleStatus) => void;
  setTrackingNumber: (trackingNumber: string) => void;
  setActiveRecording: (activeRecording: ActiveRecordingSession | null) => void;
  setDurationSeconds: (durationSeconds: number) => void;
  setUploadProgress: (uploadProgress: number) => void;
  setEstimatedFileSizeBytes: (estimatedFileSizeBytes: number) => void;
  setMediaStream: (mediaStream: MediaStream | null) => void;
  setError: (error: string | null, errorCode?: string | null) => void;
  setCompletedRecording: (completedRecording: CompletedRecordingSummary | null) => void;
  reset: () => void;
};

export type RecordingStore = RecordingStoreState & RecordingStoreActions;

const initialState: RecordingStoreState = {
  status: 'IDLE',
  trackingNumber: '',
  activeRecording: null,
  durationSeconds: 0,
  uploadProgress: 0,
  estimatedFileSizeBytes: 0,
  mediaStream: null,
  error: null,
  errorCode: null,
  completedRecording: null,
};

export const useRecordingStore = create<RecordingStore>((set) => ({
  ...initialState,
  setStatus: (status) => set({ status }),
  setTrackingNumber: (trackingNumber) => set({ trackingNumber }),
  setActiveRecording: (activeRecording) => set({ activeRecording }),
  setDurationSeconds: (durationSeconds) => set({ durationSeconds }),
  setUploadProgress: (uploadProgress) => set({ uploadProgress }),
  setEstimatedFileSizeBytes: (estimatedFileSizeBytes) => set({ estimatedFileSizeBytes }),
  setMediaStream: (mediaStream) => set({ mediaStream }),
  setError: (error, errorCode = null) => set({ error, errorCode }),
  setCompletedRecording: (completedRecording) => set({ completedRecording }),
  reset: () => set(initialState),
}));

export const selectIsRecordingBusy = (state: RecordingStore) =>
  state.status === 'RECORDING' ||
  state.status === 'REQUESTING_PERMISSION' ||
  state.status === 'STOPPING' ||
  state.status === 'UPLOADING';

export const selectShouldWarnBeforeUnload = (state: RecordingStore) =>
  state.status === 'RECORDING' || state.status === 'UPLOADING';
