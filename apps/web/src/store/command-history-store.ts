'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Command-palette history (client-only — rule §6): the destinations the user
 * recently OPENED (pages + records), surfaced as a "Terakhir" group when the
 * palette opens empty. Only the opened destination is kept — never the raw
 * query that led there, so picking "Buka penjualan S00001" leaves one entry,
 * not a duplicate "S00001" search beside it. Serializable only (title + href +
 * an icon NAME string, never a live record or component); per-browser, capped.
 */

/** Stable icon key for a recalled destination (resolved to a component in the palette). */
export type HistoryIconName =
  | 'sale'
  | 'purchase'
  | 'opname'
  | 'order'
  | 'variant'
  | 'bundle'
  | 'create'
  | 'pandu'
  | 'nav';

export interface CommandHistoryEntry {
  /** The href — also the dedupe key (re-opening a destination refreshes its recency). */
  readonly id: string;
  readonly title: string;
  readonly href: string;
  readonly iconName: HistoryIconName;
}

type CommandHistoryState = {
  recents: CommandHistoryEntry[];
  recordDestination: (entry: Omit<CommandHistoryEntry, 'id'>) => void;
  clearHistory: () => void;
};

const MAX_RECENTS = 5;

export const useCommandHistoryStore = create<CommandHistoryState>()(
  persist(
    (set) => ({
      recents: [],
      recordDestination: (input) =>
        set((state) => {
          const entry: CommandHistoryEntry = { id: input.href, ...input };
          // Move-to-front by href, then cap — the classic MRU list.
          return {
            recents: [entry, ...state.recents.filter((existing) => existing.id !== entry.id)].slice(
              0,
              MAX_RECENTS,
            ),
          };
        }),
      clearHistory: () => set({ recents: [] }),
    }),
    { name: 'falka-command-history' },
  ),
);
