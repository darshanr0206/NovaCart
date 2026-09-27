"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getWishlist, removeFromWishlist, WishlistItem } from "@/services/wishlist-service";
import { useAuthStore } from "@/store/auth-store";
import { formatINR } from "@/lib/utils";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function WishlistPage() {
  const router = useRouter();
  const { user, hydrate, hydrated } = useAuthStore();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { hydrate(); }, [hydrate]);
  useEffect(() => {
    if (!hydrated) return;
    if (!user) { router.push("/login"); return; }
    getWishlist().then(setItems).finally(() => setLoading(false));
  }, [hydrated, user, router]);

  async function handleRemove(productId: number) {
    await removeFromWishlist(productId);
    setItems((prev) => prev.filter((i) => i.product.id !== productId));
    toast.success("Removed from wishlist");
  }

  if (loading) return <div className="container-content py-24 text-center text-graphite">Loading your wishlist…</div>;

  if (items.length === 0) {
    return (
      <div className="container-content flex flex-col items-center gap-4 py-24 text-center">
        <h1 className="text-2xl font-bold text-ink">Your wishlist is empty</h1>
        <Link href="/products" className="btn-primary">Browse Products</Link>
      </div>
    );
  }

  return (
    <div className="container-content py-6 sm:py-12">
      <h1 className="mb-6 text-2xl font-bold text-ink">Your Wishlist</h1>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((item) => (
          <div key={item.id} className="card flex flex-col overflow-hidden">
            <Link href={`/products/${item.product.id}`} className="aspect-square w-full overflow-hidden bg-mist">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.product.images?.[0]?.url ?? "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=600&auto=format&fit=crop"}
                alt={item.product.name}
                className="h-full w-full object-cover"
              />
            </Link>
            <div className="flex flex-1 flex-col gap-1 p-3">
              <p className="line-clamp-2 text-sm font-medium text-ink">{item.product.name}</p>
              <p className="text-sm font-semibold text-ink">{formatINR(item.product.price)}</p>
              <button onClick={() => handleRemove(item.product.id)} className="mt-auto flex items-center gap-1 self-start text-xs text-graphite hover:text-red-500">
                <Trash2 className="h-3.5 w-3.5" /> Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
