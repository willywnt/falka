export const APP_NAME = 'Falka' as const;

export const API_VERSION = 'v1' as const;
export const API_BASE_PATH = `/api/${API_VERSION}` as const;

export const MARKETPLACE_PROVIDERS = ['shopee', 'tokopedia'] as const;

export const RECORDING_STATUSES = [
  'idle',
  'recording',
  'processing',
  'uploading',
  'completed',
  'failed',
] as const;

export const AUDIT_ACTIONS = [
  'create',
  'update',
  'delete',
  'login',
  'logout',
  'sync',
  'upload',
] as const;

export const USER_ROLES = ['owner', 'admin', 'member', 'viewer'] as const;
