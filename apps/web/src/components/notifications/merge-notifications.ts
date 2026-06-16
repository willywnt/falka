import type { AppNotification } from './types';

function toneRank(tone: AppNotification['tone']): number {
  return tone === 'urgent' ? 0 : 1;
}

/**
 * Merge the persisted event-log feed with the live derived signals into one
 * ordered tray list. A derived signal is dropped when a persisted row already
 * covers the same datum (its id === the persisted `dedupeKey`) so the two tiers
 * never double up. Persisted rows are kept ahead of derived (they carry server
 * read state and real timestamps); urgent floats to the top via a stable sort.
 */
export function mergeNotificationFeeds(
  persisted: AppNotification[],
  derived: AppNotification[],
  persistedDedupeKeys: ReadonlySet<string>,
): AppNotification[] {
  const fresh = derived.filter((item) => !persistedDedupeKeys.has(item.id));
  return [...persisted, ...fresh].sort((a, b) => toneRank(a.tone) - toneRank(b.tone));
}
