'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Notification-tray UI state (client-only — rule §6): which derived alerts the
 * user has already seen. Like Pandu's nudge ids, each notification id embeds its
 * underlying datum, so marking one read naturally re-arms when the number
 * changes (e.g. "3 oversold" → "4 oversold" is a new, unread id).
 */
type NotificationsState = {
  readIds: string[];
  markRead: (id: string) => void;
  markAllRead: (ids: readonly string[]) => void;
};

const MAX_REMEMBERED = 50;

export const useNotificationsStore = create<NotificationsState>()(
  persist(
    (set) => ({
      readIds: [],
      markRead: (id) =>
        set((state) => ({
          readIds: [...state.readIds.filter((x) => x !== id), id].slice(-MAX_REMEMBERED),
        })),
      markAllRead: (ids) =>
        set((state) => ({
          readIds: [...state.readIds.filter((x) => !ids.includes(x)), ...ids].slice(
            -MAX_REMEMBERED,
          ),
        })),
    }),
    { name: 'palka-notifications' },
  ),
);
