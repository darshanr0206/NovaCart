"use client";

import { Product } from "@/types";
import { formatINR } from "@/lib/utils";
import { useCartStore } from "@/store/cart-store";
import { useAuthStore } from "@/store/auth-store";
import { addToCart } from "@/services/cart-service";
import { Sparkles, ShoppingBag } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";

interface CompleteLookSectionProps {
  products: Product[];
}

export function CompleteLookSection({ products }: CompleteLookSectionProps) {
  const { setCart, addLocalItem } = useCartStore();
  const { user } = useAuthStore();

  if (!products || products.length === 0) return null;

  const handleQuickAdd = async (product: Product) => {
    try {
      if (user) {
        const updatedCart = await addToCart(product.id, 1);
        setCart(updatedCart);
      } else {
        addLocalItem({
          productId: product.id,
          productName: product.name,
          price: product.effectivePrice ?? product.price ?? 0,
          image: product.images?.[0],
          quantity: 1,
        });
      }
      toast.success(`Added "${product.name.slice(0, 25)}..." to cart!`);
    } catch {
      addLocalItem({
        productId: product.id,
        productName: product.name,
        price: product.effectivePrice ?? product.price ?? 0,
        image: product.images?.[0],
        quantity: 1,
      });
      toast.success(`Added "${product.name.slice(0, 25)}..." to cart!`);
    }
  };

  return (
    <div className="mt-5 bg-white rounded-sm border border-line shadow-sm p-6">
      <div className="flex items-center justify-between mb-4 border-b border-line pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-amber-500" />
          <h2 className="text-lg font-bold text-ink">Complete the Look & Complementary Gear</h2>
        </div>
        <span className="text-xs text-graphite font-medium">Curated style matches</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {products.map((item) => (
          <div
            key={item.id}
            className="flex flex-col justify-between border border-line rounded-lg p-3 hover:shadow-md transition-shadow group bg-mist/20"
          >
            <div>
              <Link href={`/products/${item.id}`} className="block relative h-36 w-full mb-3">
                <Image
                  src={
                    item.images?.[0] ||
                    "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&auto=format&fit=crop&q=80"
                  }
                  alt={item.name}
                  fill
                  className="object-contain group-hover:scale-105 transition-transform duration-200"
                />
              </Link>
              <span className="text-[11px] font-semibold text-nova-600 block mb-1 uppercase tracking-wider">
                {item.categoryName}
              </span>
              <Link
                href={`/products/${item.id}`}
                className="text-xs font-medium text-ink hover:text-nova-600 line-clamp-2 block leading-snug"
              >
                {item.name}
              </Link>
            </div>

            <div className="mt-3 pt-2 border-t border-line/60 flex items-center justify-between">
              <span className="text-sm font-bold text-ink">
                {formatINR(item.effectivePrice || item.price)}
              </span>
              <button
                onClick={() => handleQuickAdd(item)}
                className="p-1.5 rounded-full bg-nova-50 text-nova-600 hover:bg-nova-600 hover:text-white transition-colors"
                title="Add to cart"
              >
                <ShoppingBag className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
