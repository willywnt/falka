import { create } from 'zustand';

import type { InventoryListItemDto } from '../types';

type MutationTab = 'adjust' | 'reserve' | 'release';

type InventoryUiState = {
  createProductOpen: boolean;
  createVariantOpen: boolean;
  mutationTarget: InventoryListItemDto | null;
  mutationTab: MutationTab;
  selectedVariantIds: string[];
  setCreateProductOpen: (open: boolean) => void;
  setCreateVariantOpen: (open: boolean) => void;
  openMutation: (item: InventoryListItemDto, tab?: MutationTab) => void;
  closeMutation: () => void;
  toggleVariantSelection: (variantId: string) => void;
  clearSelection: () => void;
  selectAllVariants: (variantIds: string[]) => void;
};

export const useInventoryUiStore = create<InventoryUiState>((set, get) => ({
  createProductOpen: false,
  createVariantOpen: false,
  mutationTarget: null,
  mutationTab: 'adjust',
  selectedVariantIds: [],

  setCreateProductOpen: (open) => set({ createProductOpen: open }),
  setCreateVariantOpen: (open) => set({ createVariantOpen: open }),

  openMutation: (item, tab = 'adjust') => set({ mutationTarget: item, mutationTab: tab }),

  closeMutation: () => set({ mutationTarget: null }),

  toggleVariantSelection: (variantId) => {
    const current = get().selectedVariantIds;
    set({
      selectedVariantIds: current.includes(variantId)
        ? current.filter((id) => id !== variantId)
        : [...current, variantId],
    });
  },

  clearSelection: () => set({ selectedVariantIds: [] }),

  selectAllVariants: (variantIds) => set({ selectedVariantIds: variantIds }),
}));
