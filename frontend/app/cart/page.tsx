"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getCart, addToCart, updateCartItem, removeCartItem } from "@/services/cart-service";
import { useCartStore } from "@/store/cart-store";
import { useAuthStore } from "@/store/auth-store";
import { formatINR } from "@/lib/utils";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function CartPage() {
  const router = useRouter();
  const { user, hydrate, hydrated: authHydrated } = useAuthStore();
  const { cart, setCart, updateLocalQuantity, removeLocalItem, hydrated: cartHydrated } = useCartStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!authHydrated) return;
    if (user) {
      // Merge any local cart items to the server if they exist
      const localCart = useCartStore.getState().cart;
      const localItems = localCart?.items || [];

      getCart()
        .then(async (serverCart) => {
          if (localItems.length > 0) {
            let finalCart = serverCart;
            for (const item of localItems) {
              const alreadyExists = serverCart.items?.some((si) => si.productId === item.productId);
              if (!alreadyExists) {
                try {
                  finalCart = await addToCart(item.productId, item.quantity);
                } catch {
                  // Ignore unavailable items
                }
              }
            }
            setCart(finalCart);
          } else {
            setCart(serverCart);
          }
        })
        .catch(() => {
          // If server error or token expired, keep existing cached cart
        })
        .finally(() => setLoading(false));
    } else {
      // Guest cart loaded from localStorage immediately
      setLoading(false);
    }
  }, [authHydrated, user, setCart]);

  async function changeQuantity(itemId: number, quantity: number) {
    if (user) {
      try {
        const updated = await updateCartItem(itemId, quantity);
        setCart(updated);
        return;
      } catch {
        // Fallback to local update
      }
    }
    updateLocalQuantity(itemId, quantity);
  }

  async function remove(itemId: number) {
    if (user) {
      try {
        const updated = await removeCartItem(itemId);
        setCart(updated);
        toast.success("Removed from cart");
        return;
      } catch {
        // Fallback to local remove
      }
    }
    removeLocalItem(itemId);
    toast.success("Removed from cart");
  }

  const handleCheckout = () => {
    if (!user) {
      toast.info("Please log in or sign up to complete your checkout");
      router.push("/login?redirect=/checkout");
      return;
    }
    router.push("/checkout");
  };

  if (loading) {
    return <div className="container-content py-24 text-center text-graphite">Loading your cart…</div>;
  }

  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <div className="container-content flex flex-col items-center gap-4 py-24 text-center">
        <h1 className="text-2xl font-bold text-ink">Your cart is empty</h1>
        <p className="text-graphite">Explore products from trusted NovaCart sellers.</p>
        <Link href="/products" className="btn-primary">Explore Products</Link>
      </div>
    );
  }

  return (
    <div className="container-content grid gap-6 py-6 sm:py-12 lg:grid-cols-[1fr_360px]">
      <div>
        <h1 className="mb-6 text-2xl font-bold text-ink">Your Cart</h1>
        <div className="space-y-4">
          {cart.items.map((item) => (
            <div key={item.itemId} className="card flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.image ?? "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=200&auto=format&fit=crop"}
                alt={item.productName}
                className="h-16 w-16 sm:h-20 sm:w-20 rounded-lg object-cover shrink-0"
              />
              <div className="flex-1">
                <p className="text-sm font-medium text-ink">{item.productName}</p>
                <p className="text-sm text-graphite">{formatINR(item.price)}</p>
                {!item.available && <p className="text-xs text-red-500">Limited stock — quantity may be adjusted at checkout</p>}
                <div className="mt-2 flex items-center rounded-full border border-line w-fit">
                  <button onClick={() => changeQuantity(item.itemId, item.quantity - 1)} className="px-3 py-1 text-graphite hover:text-ink">−</button>
                  <span className="w-8 text-center text-sm">{item.quantity}</span>
                  <button onClick={() => changeQuantity(item.itemId, item.quantity + 1)} className="px-3 py-1 text-graphite hover:text-ink">+</button>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className="text-sm font-semibold text-ink">{formatINR(item.lineTotal)}</span>
                <button onClick={() => remove(item.itemId)} aria-label="Remove item" className="text-graphite hover:text-red-500">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card h-fit p-6">
        <h2 className="text-lg font-semibold text-ink">Order Summary</h2>
        <div className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between text-graphite">
            <span>Subtotal</span><span>{formatINR(cart.subtotal)}</span>
          </div>
          <div className="flex justify-between text-graphite">
            <span>Delivery</span><span>{cart.deliveryCharge === 0 ? "Free" : formatINR(cart.deliveryCharge)}</span>
          </div>
          <div className="flex justify-between border-t border-line pt-2 text-base font-semibold text-ink">
            <span>Total</span><span>{formatINR(cart.total)}</span>
          </div>
        </div>
        <button onClick={handleCheckout} className="btn-primary mt-6 w-full text-center">
          Proceed to Checkout
        </button>
      </div>
    </div>
  );
}
