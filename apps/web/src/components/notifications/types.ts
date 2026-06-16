import type { Route } from 'next';

export type AppNotificationTone = 'urgent' | 'info';

/** One row in the navbar tray — the unified shape both feed tiers map into. */
export type AppNotification = {
  /** Persisted: the row id. Derived: a per-datum id that re-arms when its number changes. */
  id: string;
  tone: AppNotificationTone;
  title: string;
  description: string;
  href: Route;
  read: boolean;
};
