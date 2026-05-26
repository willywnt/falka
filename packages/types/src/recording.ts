export type RecordingStatus =
  | 'idle'
  | 'recording'
  | 'processing'
  | 'uploading'
  | 'completed'
  | 'failed';

export interface Recording {
  id: string;
  userId: string;
  organizationId: string;
  title: string;
  status: RecordingStatus;
  durationSeconds: number | null;
  storageKey: string | null;
  storageUrl: string | null;
  fileSizeBytes: number | null;
  mimeType: string | null;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface RecordingUploadPayload {
  recordingId: string;
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
}

export interface RecordingUploadResult {
  storageKey: string;
  storageUrl: string;
}
