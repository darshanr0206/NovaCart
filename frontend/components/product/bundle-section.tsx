"use client";

import { useState } from "react";
import { Product } from "@/types";
import { formatINR } from "@/lib/utils";
import { useCartStore } from "@/store/cart-store";
import { useAuthStore } from "@/store/auth-store";
import { addToCart } from "@/services/cart-service";
import { Plus, Check, ShoppingCart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";

interface BundleSectionProps {
  bundleProducts: Product[];
}

export function BundleSection({ bundleProducts }: BundleSectionProps) {
  const [selectedIds, setSelectedIds] = useState<number[]>(
    bundleProducts.map((p) => p.id)
  );
  const [isAdding, setIsAdding] = useState(false);
  const { setCart, addLocalItem } = useCartStore();
  const { user } = useAuthStore();

  if (!bundleProducts || bundleProducts.length < 2) return null;

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.length > 1
          ? prev.filter((item) => item !== id)
          : prev
        : [...prev, id]
    );
  };

  const selectedItems = bundleProducts.filter((p) => selectedIds.includes(p.id));
  const totalPrice = selectedItems.reduce(
    (sum, p) => sum + Number(p.effectivePrice || p.price),
    0
  );
  const originalPrice = selectedItems.reduce(
    (sum, p) => sum + Number(p.price),
    0
  );
  const savings = Math.max(0, originalPrice - totalPrice);

  const handleAddBundleToCart = async () => {
    setIsAdding(true);
    try {
      if (user) {
        let latestCart = null;
        for (const item of selectedItems) {
          latestCart = await addToCart(item.id, 1);
        }
        if (latestCart) setCart(latestCart);
      } else {
        for (const item of selectedItems) {
          addLocalItem({
            productId: item.id,
            productName: item.name,
            price: item.effectivePrice ?? item.price ?? 0,
            image: item.images?.[0],
            quantity: 1,
          });
        }
      }
      toast.success(`Added ${selectedItems.length} items to cart!`);
    } catch {
      for (const item of selectedItems) {
        addLocalItem({
          productId: item.id,
          productName: item.name,
          price: item.effectivePrice ?? item.price ?? 0,
          image: item.images?.[0],
          quantity: 1,
        });
      }
      toast.success(`Added ${selectedItems.length} items to cart!`);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="mt-5 bg-white rounded-sm border border-line shadow-sm p-6">
      <h2 className="text-lg font-bold text-ink mb-4 border-b border-line pb-2 flex items-center gap-2">
        <span>Frequently Bought Together</span>
        <span className="text-xs bg-emerald-100 text-emerald-700 font-semibold px-2 py-0.5 rounded-full">
          Save extra on bundle
        </span>
      </h2>

      <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6 justify-between">
        {/* Product Cards Row */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full lg:w-auto">
          {bundleProducts.map((item, idx) => {
            const isChecked = selectedIds.includes(item.id);
            return (
              <div key={item.id} className="flex items-center gap-2 sm:gap-3">
                <div
                  onClick={() => toggleSelect(item.id)}
                  className={`flex flex-col items-center p-2.5 sm:p-3 rounded-lg border cursor-pointer transition-all w-32 sm:w-44 ${
                    isChecked
                      ? "border-nova-500 bg-nova-50/20 shadow-xs"
                      : "border-line opacity-50 bg-gray-50"
                  }`}
                >
                  <div className="relative h-24 w-24 sm:h-28 sm:w-28 mb-2">
                    <Image
                      src={
                        item.images?.[0] ||
                        "https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&auto=format&fit=crop&q=80"
                      }
                      alt={item.name}
                      fill
                      className="object-contain"
                    />
                    <div
                      className={`absolute top-0 left-0 h-5 w-5 rounded border flex items-center justify-center transition-colors ${
                        isChecked
                          ? "bg-nova-600 border-nova-600 text-white"
                          : "border-gray-400 bg-white"
                      }`}
                    >
                      {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                    </div>
                  </div>
                  <Link
                    href={`/products/${item.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="text-xs font-medium text-ink hover:text-nova-600 text-center line-clamp-2"
                  >
                    {item.name}
                  </Link>
                  <span className="text-xs sm:text-sm font-bold text-ink mt-1">
                    {formatINR(item.effectivePrice || item.price)}
                  </span>
                </div>

                {idx < bundleProducts.length - 1 && (
                  <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-mist flex items-center justify-center text-graphite font-bold shrink-0">
                    <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Total Price & Add to Cart */}
        <div className="lg:border-l lg:border-line lg:pl-8 flex flex-col gap-2 w-full lg:w-auto min-w-[200px] border-t lg:border-t-0 pt-4 lg:pt-0 border-line">
          <span className="text-xs text-graphite font-medium">
            Total Price for {selectedItems.length} items:
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-bold text-ink">
              {formatINR(totalPrice)}
            </span>
            {savings > 0 && (
              <span className="text-xs sm:text-sm text-graphite line-through">
                {formatINR(originalPrice)}
              </span>
            )}
          </div>
          {savings > 0 && (
            <span className="text-xs text-green-600 font-semibold">
              Bundle Savings: {formatINR(savings)}
            </span>
          )}

          <button
            onClick={handleAddBundleToCart}
            disabled={isAdding || selectedItems.length === 0}
            className="mt-2 flex items-center justify-center gap-2 bg-nova-600 hover:bg-nova-700 text-white font-semibold px-5 py-2.5 rounded-sm transition-colors shadow-xs disabled:opacity-50 w-full sm:w-auto text-xs sm:text-sm"
          >
            <ShoppingCart className="h-4 w-4" />
            <span>{isAdding ? "Adding Bundle…" : "Add Bundle to Cart"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
