import { apiFetch } from '@/lib/api/fetch-client';
import { formatApiErrorMessage } from '@/lib/api/format-api-error';
import { apiRoutes } from '@/lib/api/routes';

import type {
  PresignUploadRequest,
  PresignUploadResponse,
  UploadFileOptions,
  UploadFileResult,
} from '../types';

function parseUploadError(status: number, body: string): Error {
  try {
    const payload = JSON.parse(body) as { error?: { message?: string; code?: string } };
    const message = payload.error?.message ?? 'Upload failed';
    const error = new Error(message) as Error & { code?: string; statusCode?: number };
    error.code = payload.error?.code;
    error.statusCode = status;
    return error;
  } catch {
    return new Error(`Upload failed with status ${status}`);
  }
}

async function requestPresignedUrl(
  request: PresignUploadRequest,
): Promise<PresignUploadResponse> {
  const result = await apiFetch<PresignUploadResponse>(apiRoutes.uploadsPresign, {
    method: 'POST',
    body: request,
  });

  if (!result.success) {
    const error = new Error(formatApiErrorMessage(result.error)) as Error & { code?: string; statusCode?: number };
    error.code = result.error.code;
    error.statusCode = 400;
    throw error;
  }

  return result.data;
}

function uploadToPresignedUrl(
  uploadUrl: string,
  file: File,
  options: Pick<UploadFileOptions, 'onProgress' | 'signal'>,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', uploadUrl);
    xhr.setRequestHeader('Content-Type', file.type);

    if (options.signal) {
      if (options.signal.aborted) {
        reject(new DOMException('Upload aborted', 'AbortError'));
        return;
      }

      options.signal.addEventListener('abort', () => {
        xhr.abort();
      });
    }

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable || !options.onProgress) return;

      options.onProgress({
        loadedBytes: event.loaded,
        totalBytes: event.total,
        percent: Math.round((event.loaded / event.total) * 100),
      });
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
        return;
      }

      if (xhr.status === 403) {
        const error = new Error('The upload URL has expired. Request a new one.') as Error & {
          code?: string;
        };
        error.code = 'UPLOAD_EXPIRED';
        reject(error);
        return;
      }

      reject(parseUploadError(xhr.status, xhr.responseText));
    };

    xhr.onerror = () => {
      reject(
        new Error(
          'Upload to storage failed. Configure CORS on your R2 bucket to allow PUT requests from this site (e.g. http://localhost:3000). See scripts/r2-cors.json in the repo.',
        ),
      );
    };

    xhr.onabort = () => {
      reject(new DOMException('Upload aborted', 'AbortError'));
    };

    xhr.send(file);
  });
}

/**
 * Requests a presigned URL and uploads the file directly to object storage.
 */
export async function uploadFile({
  file,
  onProgress,
  signal,
}: UploadFileOptions): Promise<UploadFileResult> {
  const presigned = await requestPresignedUrl({
    filename: file.name,
    mimeType: file.type,
    fileSizeBytes: file.size,
  });

  await uploadToPresignedUrl(presigned.uploadUrl, file, { onProgress, signal });

  return {
    storageKey: presigned.storageKey,
    publicUrl: presigned.publicUrl,
  };
}

export { requestPresignedUrl, uploadToPresignedUrl };
