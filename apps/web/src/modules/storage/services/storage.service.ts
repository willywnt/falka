import 'server-only';

import { MAX_UPLOAD_SIZE_BYTES } from '@olshop/config/limits';

import { StorageError } from '../errors/storage-errors';
import { appLogger } from '@/lib/logger';

import type {
  GenerateAccessUrlParams,
  GenerateAccessUrlResult,
  GenerateUploadUrlInput,
  GenerateUploadUrlResult,
  StorageProvider,
} from '../types';
import { isAllowedMimeType, hasAllowedExtension } from '../utils/mime';
import { generateRecordingFilename, generateStorageKey } from '../utils/storage-key';
import { getR2StorageProvider } from './r2.client';

export class StorageService {
  constructor(private readonly provider: StorageProvider = getR2StorageProvider()) {}

  async generateUploadUrl(input: GenerateUploadUrlInput): Promise<GenerateUploadUrlResult> {
    this.validateUploadRequest(input);

    const generatedFilename = generateRecordingFilename();
    const storageKey = generateStorageKey(input.userId, generatedFilename);
    const publicUrl = this.getPublicUrl(storageKey);

    const presigned = await this.provider.generateUploadUrl({
      storageKey,
      mimeType: input.mimeType,
      fileSizeBytes: input.fileSizeBytes,
    });

    appLogger.info('storage.upload.presign.created', {
      userId: input.userId,
      storageKey,
      fileSizeBytes: input.fileSizeBytes,
      mimeType: input.mimeType,
      expiresAt: presigned.expiresAt.toISOString(),
    });

    return {
      uploadUrl: presigned.uploadUrl,
      storageKey,
      publicUrl,
      expiresAt: presigned.expiresAt,
    };
  }

  getPublicUrl(storageKey: string): string {
    return this.provider.getPublicUrl(storageKey);
  }

  async generateAccessUrl(params: GenerateAccessUrlParams): Promise<GenerateAccessUrlResult> {
    const access = await this.provider.generateAccessUrl(params);

    appLogger.info('storage.access.presign.created', {
      storageKey: params.storageKey,
      disposition: params.disposition ?? 'inline',
      expiresAt: access.expiresAt.toISOString(),
    });

    return access;
  }

  async deleteObject(storageKey: string): Promise<void> {
    appLogger.info('storage.object.delete.started', { storageKey });

    await this.provider.deleteObject(storageKey);

    appLogger.info('storage.object.delete.completed', { storageKey });
  }

  private validateUploadRequest(input: GenerateUploadUrlInput): void {
    if (!isAllowedMimeType(input.mimeType)) {
      throw StorageError.invalidMimeType();
    }

    if (!hasAllowedExtension(input.filename, ['.webm'])) {
      throw StorageError.invalidFile('Only .webm files are supported.');
    }

    if (input.fileSizeBytes <= 0 || input.fileSizeBytes > MAX_UPLOAD_SIZE_BYTES) {
      throw StorageError.invalidFile('File exceeds the 500 MB upload limit.');
    }
  }
}

export const storageService = new StorageService();
