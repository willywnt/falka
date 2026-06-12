/** Query keys for the org/team module — one hierarchy, invalidate by prefix. */
export const orgKeys = {
  all: ['org'] as const,
  summary: ['org', 'summary'] as const,
};
