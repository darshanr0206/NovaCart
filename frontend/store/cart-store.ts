"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Cart } from "@/types";

interface CartState {
  cart: Cart | null;
  hydrated: boolean;
  setHydrated: (hydrated: boolean) => void;
  setCart: (cart: Cart | null) => void;
  clearCart: () => void;
  itemCount: () => number;
  addLocalItem: (item: { productId: number; productName: string; price: number; image?: string; quantity: number }) => void;
  updateLocalQuantity: (itemId: number, quantity: number) => void;
  removeLocalItem: (itemId: number) => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      cart: null,
      hydrated: false,
      setHydrated: (hydrated) => set({ hydrated }),
      setCart: (cart) => set({ cart }),
      clearCart: () => set({ cart: null }),
      itemCount: () => get().cart?.items?.reduce((sum, i) => sum + (i.quantity || 0), 0) ?? 0,

      addLocalItem: (newItem) => {
        const currentCart = get().cart ?? {
          cartId: 0,
          items: [],
          subtotal: 0,
          deliveryCharge: 0,
          discount: 0,
          total: 0,
        };

        const items = currentCart.items || [];
        const existingIndex = items.findIndex((i) => i.productId === newItem.productId);
        let updatedItems = [...items];

        if (existingIndex >= 0) {
          const existing = updatedItems[existingIndex];
          const newQty = existing.quantity + newItem.quantity;
          updatedItems[existingIndex] = {
            ...existing,
            quantity: newQty,
            lineTotal: Math.round(existing.price * newQty * 100) / 100,
          };
        } else {
          updatedItems.push({
            itemId: Date.now(),
            productId: newItem.productId,
            productName: newItem.productName,
            image: newItem.image,
            price: newItem.price,
            quantity: newItem.quantity,
            lineTotal: Math.round(newItem.price * newItem.quantity * 100) / 100,
            available: true,
          });
        }

        const subtotal = updatedItems.reduce((sum, i) => sum + i.lineTotal, 0);
        const deliveryCharge = subtotal >= 500 || subtotal === 0 ? 0 : 49;
        const total = subtotal + deliveryCharge;

        set({
          cart: {
            ...currentCart,
            items: updatedItems,
            subtotal,
            deliveryCharge,
            discount: 0,
            total,
          },
        });
      },

      updateLocalQuantity: (itemId, quantity) => {
        const currentCart = get().cart;
        if (!currentCart) return;

        let updatedItems: typeof currentCart.items;
        if (quantity <= 0) {
          updatedItems = currentCart.items.filter((i) => i.itemId !== itemId);
        } else {
          updatedItems = currentCart.items.map((i) =>
            i.itemId === itemId
              ? { ...i, quantity, lineTotal: Math.round(i.price * quantity * 100) / 100 }
              : i
          );
        }

        const subtotal = updatedItems.reduce((sum, i) => sum + i.lineTotal, 0);
        const deliveryCharge = subtotal >= 500 || subtotal === 0 ? 0 : 49;
        const total = subtotal + deliveryCharge;

        set({
          cart: {
            ...currentCart,
            items: updatedItems,
            subtotal,
            deliveryCharge,
            total,
          },
        });
      },

      removeLocalItem: (itemId) => {
        const currentCart = get().cart;
        if (!currentCart) return;

        const updatedItems = currentCart.items.filter((i) => i.itemId !== itemId);
        const subtotal = updatedItems.reduce((sum, i) => sum + i.lineTotal, 0);
        const deliveryCharge = subtotal >= 500 || subtotal === 0 ? 0 : 49;
        const total = subtotal + deliveryCharge;

        set({
          cart: {
            ...currentCart,
            items: updatedItems,
            subtotal,
            deliveryCharge,
            total,
          },
        });
      },
    }),
    {
      name: "novacart-cart-storage",
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    }
  )
);
