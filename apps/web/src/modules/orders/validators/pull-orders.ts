import { z } from 'zod';

/** Optional list of connection ids to pull from; omitted = every active store. */
export const pullOrdersBodySchema = z.object({
  connectionIds: z.array(z.string().cuid()).max(50).optional(),
  /** Ignore the incremental cursor and re-pull the full backfill window (re-sync / fix backlog). */
  full: z.boolean().optional(),
});

export type PullOrdersBody = z.infer<typeof pullOrdersBodySchema>;
