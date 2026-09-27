"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addToCart } from "@/services/cart-service";
import { useCartStore } from "@/store/cart-store";
import { useAuthStore } from "@/store/auth-store";
import { getApiErrorMessage } from "@/lib/api";
import { toast } from "sonner";

export function ProductActions({
  productId,
  inStock,
  product,
}: {
  productId: number;
  inStock: boolean;
  product?: { name?: string; price?: number; effectivePrice?: number; images?: string[] };
}) {
  const router = useRouter();
  const { user } = useAuthStore();
  const { setCart, addLocalItem } = useCartStore();
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);

  async function handleAdd(buyNow: boolean) {
    setLoading(true);
    try {
      if (user) {
        const cart = await addToCart(productId, quantity);
        setCart(cart);
      } else {
        // Instant Guest Cart in localStorage
        const price = product?.effectivePrice ?? product?.price ?? 0;
        addLocalItem({
          productId,
          productName: product?.name || "Product",
          price,
          image: product?.images?.[0],
          quantity,
        });
      }
      toast.success("Added to cart!");
      if (buyNow) {
        router.push(user ? "/checkout" : "/cart");
      }
    } catch (err) {
      // If server error, fallback to local cart so user never loses their selection
      const price = product?.effectivePrice ?? product?.price ?? 0;
      addLocalItem({
        productId,
        productName: product?.name || "Product",
        price,
        image: product?.images?.[0],
        quantity,
      });
      toast.success("Added to cart!");
      if (buyNow) router.push("/cart");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-6 flex flex-wrap sm:flex-nowrap items-center gap-3 w-full">
      <div className="flex items-center rounded-full border border-line shrink-0 bg-white">
        <button
          onClick={() => setQuantity((q) => Math.max(1, q - 1))}
          className="px-3 py-2 text-graphite hover:text-ink text-sm font-bold"
          aria-label="Decrease quantity"
        >
          −
        </button>
        <span className="w-8 text-center text-sm font-semibold">{quantity}</span>
        <button
          onClick={() => setQuantity((q) => q + 1)}
          className="px-3 py-2 text-graphite hover:text-ink text-sm font-bold"
          aria-label="Increase quantity"
        >
          +
        </button>
      </div>
      <button
        disabled={!inStock || loading}
        onClick={() => handleAdd(false)}
        className="btn-secondary flex-1 py-2.5 sm:py-3 px-4 text-xs sm:text-sm font-bold justify-center disabled:opacity-50 min-w-[110px]"
      >
        {loading ? "Adding…" : "Add to Cart"}
      </button>
      <button
        disabled={!inStock || loading}
        onClick={() => handleAdd(true)}
        className="btn-primary flex-1 py-2.5 sm:py-3 px-4 text-xs sm:text-sm font-bold justify-center disabled:opacity-50 min-w-[110px] shadow-sm"
      >
        Buy Now
      </button>
    </div>
  );
}
