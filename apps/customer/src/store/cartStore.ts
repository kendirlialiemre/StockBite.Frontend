import { create } from 'zustand';

export interface CartPackage {
  id: string;
  name: string;
  description: string;
  price: number;
  modules: { moduleType: number; moduleName: string }[];
}

interface CartStore {
  items: CartPackage[];
  addItem: (pkg: CartPackage) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  total: () => number;
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  addItem: (pkg) => {
    if (get().items.find((i) => i.id === pkg.id)) return;
    set((s) => ({ items: [...s.items, pkg] }));
  },
  removeItem: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
  clearCart: () => set({ items: [] }),
  total: () => get().items.reduce((sum, i) => sum + i.price, 0),
}));
