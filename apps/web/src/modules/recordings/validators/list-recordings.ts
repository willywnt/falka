import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '@falka/config/limits';
import { z } from 'zod';

export const RECORDING_STATUS_FILTERS = [
  'ALL',
  'COMPLETED',
  'FAILED',
  'UPLOADING',
  'RECORDING',
] as const;

export type RecordingStatusFilter = (typeof RECORDING_STATUS_FILTERS)[number];

export const RECORDING_SORT_FIELDS = [
  'createdAt',
  'durationSeconds',
  'fileSizeBytes',
  'noResi',
] as const;

export type RecordingSortField = (typeof RECORDING_SORT_FIELDS)[number];

export const listRecordingsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
  search: z.string().trim().max(100).optional(),
  status: z.enum(RECORDING_STATUS_FILTERS).default('ALL'),
  sortBy: z.enum(RECORDING_SORT_FIELDS).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type ListRecordingsQuery = z.infer<typeof listRecordingsQuerySchema>;

export const recordingIdParamSchema = z.object({
  id: z.string().cuid(),
});

export type RecordingIdParam = z.infer<typeof recordingIdParamSchema>;
