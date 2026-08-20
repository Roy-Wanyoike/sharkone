import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface RecentlyViewedStore {
  productIds: string[];
  addProduct: (id: string) => void;
}

export const useRecentlyViewedStore = create<RecentlyViewedStore>()(
  persist(
    (set, get) => ({
      productIds: [],

      addProduct: (id: string) => {
        const current = get().productIds.filter((pid) => pid !== id);
        set({ productIds: [id, ...current].slice(0, 20) });
      },
    }),
    {
      name: 'sharkone-recently-viewed',
      partialize: (state) => ({ productIds: state.productIds }),
    }
  )
);
