'use client';

import type { Route } from 'next';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Pandu UI state (client-only — rule §6): which nudges the user dismissed,
 * where the dock pill lives, and the recent ask→navigation pairs. Nudge ids
 * embed their underlying datum, so a dismissal re-arms naturally when the
 * number changes (e.g. urgent count 2 → 3 is a new id).
 */

/**
 * One recalled question: the text the user asked and the screen the honest
 * keyword router sent them to. Stays navigate-only — no generated answer is
 * ever stored, so the thread can never fake intelligence.
 */
export interface PanduAsk {
  /** `a:<lowercased query>` — dedupe key. */
  readonly id: string;
  readonly query: string;
  readonly label: string;
  readonly href: Route;
}

type PanduState = {
  dismissedNudgeIds: string[];
  dismissNudge: (id: string) => void;
  /** Pill tucked away into the slim edge tab. */
  dockCollapsed: boolean;
  setDockCollapsed: (collapsed: boolean) => void;
  /** User-dragged distance from the bottom edge (px); null = responsive default. */
  dockBottomOffset: number | null;
  setDockBottomOffset: (offset: number | null) => void;
  /** Recent ask→navigation pairs (most recent first). */
  askHistory: PanduAsk[];
  recordAsk: (ask: Omit<PanduAsk, 'id'>) => void;
  clearAskHistory: () => void;
};

const MAX_REMEMBERED = 50;
const MAX_ASKS = 8;

export const usePanduStore = create<PanduState>()(
  persist(
    (set) => ({
      dismissedNudgeIds: [],
      dismissNudge: (id) =>
        set((state) => ({
          dismissedNudgeIds: [...state.dismissedNudgeIds.filter((x) => x !== id), id].slice(
            -MAX_REMEMBERED,
          ),
        })),
      dockCollapsed: false,
      setDockCollapsed: (collapsed) => set({ dockCollapsed: collapsed }),
      dockBottomOffset: null,
      setDockBottomOffset: (offset) => set({ dockBottomOffset: offset }),
      askHistory: [],
      recordAsk: (ask) =>
        set((state) => {
          const id = `a:${ask.query.trim().toLowerCase()}`;
          const entry: PanduAsk = { id, ...ask };
          return {
            askHistory: [entry, ...state.askHistory.filter((existing) => existing.id !== id)].slice(
              0,
              MAX_ASKS,
            ),
          };
        }),
      clearAskHistory: () => set({ askHistory: [] }),
    }),
    { name: 'palka-pandu' },
  ),
);
