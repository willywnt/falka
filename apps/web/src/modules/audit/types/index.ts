export interface AuditLogListItem {
  id: string;
  action: string;
  /** Resource TYPE (e.g. 'sale', 'product'); the row id is in resourceId. */
  resource: string;
  resourceId: string | null;
  actorUserId: string | null;
  /** The actor's display name (email fallback); null for system events. */
  actorName: string | null;
  createdAt: string;
}
