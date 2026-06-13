/** A row in the platform admin-ops organization list (newest first). */
export interface AdminOrgListItem {
  id: string;
  name: string;
  /** Subscription/config label, e.g. FREE. */
  plan: string;
  /** null = unlimited members. */
  memberLimit: number | null;
  /** Quota/usage as strings — BigInt doesn't survive JSON. */
  storageQuotaBytes: string;
  storageUsedBytes: string;
  /** Current member count (all roles). */
  memberCount: number;
  /** The OWNER membership's user email; null if somehow ownerless. */
  ownerEmail: string | null;
  createdAt: string;
}

/** Result of provisioning a new organization + owner account. */
export interface CreateOrganizationResult {
  organizationId: string;
  ownerUserId: string;
}
