export interface PresignUploadRequest {
  filename: string;
  mimeType: string;
  fileSizeBytes: number;
}

export interface PresignUploadResponse {
  uploadUrl: string;
  storageKey: string;
  publicUrl: string;
  expiresAt: string;
}

export interface GenerateUploadUrlInput {
  organizationId: string;
  filename: string;
  mimeType: string;
  fileSizeBytes: number;
}

export interface GenerateUploadUrlResult {
  uploadUrl: string;
  storageKey: string;
  publicUrl: string;
  expiresAt: Date;
}

export interface PresignedUploadParams {
  storageKey: string;
  mimeType: string;
  fileSizeBytes: number;
}

export interface PresignedUploadResult {
  uploadUrl: string;
  expiresAt: Date;
}

export type StorageAccessDisposition = 'inline' | 'attachment';

export interface GenerateAccessUrlParams {
  storageKey: string;
  mimeType: string;
  disposition?: StorageAccessDisposition;
  filename?: string;
}

export interface GenerateAccessUrlResult {
  url: string;
  expiresAt: Date;
}

export interface StorageProviderConfig {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  publicBaseUrl: string;
  uploadExpirySeconds: number;
  accessExpirySeconds: number;
}

/** Abstraction for object storage backends (R2 today, others later). */
export interface StorageProvider {
  generateUploadUrl(params: PresignedUploadParams): Promise<PresignedUploadResult>;
  generateAccessUrl(params: GenerateAccessUrlParams): Promise<GenerateAccessUrlResult>;
  getPublicUrl(storageKey: string): string;
  deleteObject(storageKey: string): Promise<void>;
}

export interface StorageQuotaSnapshot {
  usedBytes: bigint;
  quotaBytes: bigint;
  remainingBytes: bigint;
  usagePercent: number;
}

export interface StorageQuotaResponse {
  usedBytes: number;
  quotaBytes: number;
  remainingBytes: number;
  usagePercent: number;
}

export interface UploadProgressEvent {
  loadedBytes: number;
  totalBytes: number;
  percent: number;
}

export interface UploadFileOptions {
  file: File;
  onProgress?: (event: UploadProgressEvent) => void;
  signal?: AbortSignal;
}

export interface UploadFileResult {
  storageKey: string;
  publicUrl: string;
}

export interface UploadFileError extends Error {
  code?: string;
  statusCode?: number;
}
