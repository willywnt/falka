'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Pandu UI state (client-only — rule §6): which nudges the user dismissed,
 * plus where the dock pill lives. Nudge ids embed their underlying datum, so
 * a dismissal re-arms naturally when the number changes (e.g. urgent count
 * 2 → 3 is a new id).
 */
type PanduState = {
  dismissedNudgeIds: string[];
  dismissNudge: (id: string) => void;
  /** Pill tucked away into the slim edge tab. */
  dockCollapsed: boolean;
  setDockCollapsed: (collapsed: boolean) => void;
  /** User-dragged distance from the bottom edge (px); null = responsive default. */
  dockBottomOffset: number | null;
  setDockBottomOffset: (offset: number | null) => void;
};

const MAX_REMEMBERED = 50;

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
    }),
    { name: 'falka-pandu' },
  ),
);
