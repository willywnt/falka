import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/** Pinned favorites are capped — a POS quick strip stops being quick past this. */
const MAX_FAVORITES = 12;

/** Toggle an id in the list; when adding past the cap, drop the oldest entry. */
function toggleId(ids: string[], id: string): string[] {
  if (ids.includes(id)) return ids.filter((existing) => existing !== id);
  const next = [...ids, id];
  return next.length > MAX_FAVORITES ? next.slice(next.length - MAX_FAVORITES) : next;
}

type PosFavoritesState = {
  favoriteVariantIds: string[];
  favoriteBundleIds: string[];
};

type PosFavoritesActions = {
  toggleFavoriteVariant: (id: string) => void;
  toggleFavoriteBundle: (id: string) => void;
};

export type PosFavoritesStore = PosFavoritesState & PosFavoritesActions;

/**
 * Pinned POS favorites — pure UI preference (ids only, persisted per browser).
 * The items themselves stay in the TanStack Query cache; this never holds them.
 */
export const usePosFavoritesStore = create<PosFavoritesStore>()(
  persist(
    (set) => ({
      favoriteVariantIds: [],
      favoriteBundleIds: [],
      toggleFavoriteVariant: (id) =>
        set((state) => ({ favoriteVariantIds: toggleId(state.favoriteVariantIds, id) })),
      toggleFavoriteBundle: (id) =>
        set((state) => ({ favoriteBundleIds: toggleId(state.favoriteBundleIds, id) })),
    }),
    { name: 'palka-pos-favorites' },
  ),
);
