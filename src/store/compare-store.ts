import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CompareStore {
  productIds: string[];
  addProduct: (id: string) => void;
  removeProduct: (id: string) => void;
  clearComparison: () => void;
  isComparing: (id: string) => boolean;
}

const MAX_COMPARE = 4;

export const useCompareStore = create<CompareStore>()(
  persist(
    (set, get) => ({
      productIds: [],

      addProduct: (id: string) => {
        const { productIds } = get();
        if (productIds.includes(id)) return;
        if (productIds.length >= MAX_COMPARE) return;
        set({ productIds: [...productIds, id] });
      },

      removeProduct: (id: string) => {
        set({ productIds: get().productIds.filter((pid) => pid !== id) });
      },

      clearComparison: () => set({ productIds: [] }),

      isComparing: (id: string) => get().productIds.includes(id),
    }),
    {
      name: 'sharkone-compare',
    }
  )
);
