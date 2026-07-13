"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  id: string; // unique cart item ID (product_id + '-' + variant_id)
  product_id: string;
  variant_id?: string | null;
  variant_name_en?: string | null;
  variant_name_ar?: string | null;
  name_en: string;
  name_ar: string;
  price: number;
  quantity: number;
  image_path: string | null;
  slug: string;
  stock_quantity: number;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  getItemCount: () => number;
  getSubtotal: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item, quantity = 1) => {
        set((state) => {
          const existingIndex = state.items.findIndex((i) => i.id === item.id);
          if (existingIndex > -1) {
            const newItems = [...state.items];
            const newQty = newItems[existingIndex].quantity + quantity;
            newItems[existingIndex] = {
              ...newItems[existingIndex],
              quantity: Math.min(newQty, item.stock_quantity),
            };
            return { items: newItems };
          }
          return {
            items: [
              ...state.items,
              { ...item, quantity: Math.min(quantity, item.stock_quantity) },
            ],
          };
        });
      },

      removeItem: (id) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        }));
      },

      updateQuantity: (id, quantity) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id
              ? { ...item, quantity: Math.max(1, Math.min(quantity, item.stock_quantity)) }
              : item
          ),
        }));
      },

      clearCart: () => set({ items: [] }),

      getItemCount: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      getSubtotal: () => {
        return get().items.reduce(
          (total, item) => total + item.price * item.quantity,
          0
        );
      },
    }),
    {
      name: "yoticare-cart",
    }
  )
);
