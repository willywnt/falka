/** Filter for records that have not been soft-deleted. */
export const notDeleted = {
  deletedAt: null,
} as const;

/** Returns update payload to soft-delete a record. */
export function softDeleteData(deletedAt: Date = new Date()) {
  return { deletedAt };
}

/** Returns update payload to restore a soft-deleted record. */
export function restoreSoftDeleteData() {
  return { deletedAt: null };
}

/** Returns true when the record is considered soft-deleted. */
export function isSoftDeleted(deletedAt: Date | null | undefined): boolean {
  return deletedAt != null;
}
