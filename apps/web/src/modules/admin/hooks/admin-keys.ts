/** Query keys for the platform admin-ops console — one hierarchy. */
export const adminKeys = {
  all: ['admin'] as const,
  organizations: ['admin', 'organizations'] as const,
  ops: ['admin', 'ops'] as const,
};
