export type AuditAction = 'create' | 'update' | 'delete' | 'login' | 'logout' | 'sync' | 'upload';

export interface AuditLogEntry {
  id: string;
  organizationId: string;
  userId: string | null;
  action: AuditAction;
  resourceType: string;
  resourceId: string | null;
  metadata: Record<string, unknown>;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
}

export interface Organization {
  id: string;
  name: string;
  storageUsedBytes: number;
  storageQuotaBytes: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiResponse<T> {
  data: T;
  meta?: {
    page?: number;
    pageSize?: number;
    total?: number;
  };
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface PaginatedQuery {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
