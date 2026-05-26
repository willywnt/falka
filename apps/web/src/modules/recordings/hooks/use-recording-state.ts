'use client';

import { useRecordingStore } from '../store/recording.store';

export { useRecording } from './use-recording';
export { useActiveRecordingQuery } from './use-recording-api';
export {
  useDeleteRecordingMutation,
  useDownloadRecordingMutation,
  useRecordingDetailQuery,
  useRecordingsListQuery,
} from './use-recordings-management';

export function useRecordingState() {
  const status = useRecordingStore((state) => state.status);
  const durationSeconds = useRecordingStore((state) => state.durationSeconds);
  const error = useRecordingStore((state) => state.error);

  return {
    status,
    durationSeconds,
    error,
    isRecording: status === 'RECORDING',
  };
}
