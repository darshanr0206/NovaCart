"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Product } from "@/types";
import { formatINR } from "@/lib/utils";
import { Star, Heart, ShoppingCart, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { addToCart } from "@/services/cart-service";
import { useCartStore } from "@/store/cart-store";
import { useAuthStore } from "@/store/auth-store";
import { getApiErrorMessage } from "@/lib/api";

export function ProductCard({ product }: { product: Product }) {
  const image = product.images?.[0] ?? "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=800&auto=format&fit=crop";
  const hasDiscount = product.discountPercent > 0;
  const discountAmount = hasDiscount ? Math.round(Number(product.discountPercent)) : 0;

  const router = useRouter();
  const { user } = useAuthStore();
  const { setCart, addLocalItem } = useCartStore();
  const [loading, setLoading] = useState(false);

  // Navigate to product details on clicking anywhere on the card
  const handleCardClick = () => {
    router.push(`/products/${product.id}`);
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setLoading(true);
    try {
      if (user) {
        const cart = await addToCart(product.id, 1);
        setCart(cart);
      } else {
        const price = product.effectivePrice ?? product.price ?? 0;
        addLocalItem({
          productId: product.id,
          productName: product.name,
          price,
          image: product.images?.[0],
          quantity: 1,
        });
      }
      toast.success("Added to cart!");
    } catch {
      // Fallback to local cart on any network hiccup
      const price = product.effectivePrice ?? product.price ?? 0;
      addLocalItem({
        productId: product.id,
        productName: product.name,
        price,
        image: product.images?.[0],
        quantity: 1,
      });
      toast.success("Added to cart!");
    } finally {
      setLoading(false);
    }
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toast.success("Added to wishlist!");
  };

  return (
    <div
      onClick={handleCardClick}
      className="group relative flex flex-col overflow-hidden bg-white rounded-2xl border border-slate-100/90 shadow-[0_1px_4px_rgba(0,0,0,0.03)] hover:shadow-md hover:border-slate-200 transition-all duration-200 h-full cursor-pointer select-none"
    >
      {/* Top Row: Discount badge on left, Wishlist on right */}
      <div className="absolute top-2 left-2 right-2 z-10 flex items-center justify-between pointer-events-none">
        {hasDiscount ? (
          <span className="bg-[#ff385c] text-white text-[10px] sm:text-[11px] font-extrabold px-1.5 py-0.5 rounded shadow-xs pointer-events-auto">
            -{discountAmount}%
          </span>
        ) : (
          <span />
        )}

        <button
          type="button"
          onClick={handleWishlist}
          className="pointer-events-auto h-7 w-7 rounded-full bg-white/70 backdrop-blur-xs flex items-center justify-center text-slate-400 hover:text-rose-500 transition-transform active:scale-90"
          aria-label="Add to wishlist"
        >
          <Heart className="h-4 w-4 stroke-[1.8]" />
        </button>
      </div>

      {/* Product image */}
      <div className="relative w-full aspect-square bg-white p-3 pt-6 flex items-center justify-center shrink-0 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image}
          alt={product.name}
          className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
      </div>

      {/* Card body */}
      <div className="flex flex-1 flex-col p-2.5 sm:p-3 gap-1">
        {/* Brand */}
        {product.brand && product.brand !== "NovaBrand" && (
          <span className="text-[10px] sm:text-[11px] font-bold text-[#6938ef] uppercase tracking-wider truncate block">
            {product.brand}
          </span>
        )}

        {/* Product name */}
        <h3
          className="text-xs sm:text-[13px] font-medium text-slate-900 group-hover:text-[#6938ef] transition-colors line-clamp-2 leading-snug min-h-[2.3rem]"
          title={product.name}
        >
          {product.name}
        </h3>

        {/* Rating */}
        <div className="flex items-center gap-1.5 mt-0.5">
          <div className="inline-flex items-center gap-0.5 bg-amber-50 text-amber-900 border border-amber-200/60 px-1 py-0.5 rounded text-[10px] font-bold shrink-0">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400 shrink-0" />
            <span>
              {product.averageRating > 0 ? product.averageRating.toFixed(1) : "New"}
            </span>
          </div>
          {product.reviewCount > 0 && (
            <span className="text-slate-400 text-[10px] sm:text-[11px] font-normal truncate">
              ({product.reviewCount.toLocaleString("en-IN")})
            </span>
          )}
        </div>

        {/* Price block */}
        <div className="flex items-baseline gap-1.5 flex-wrap mt-0.5">
          <span className="text-sm sm:text-base font-extrabold text-slate-900">
            {formatINR(product.effectivePrice)}
          </span>
          {hasDiscount && (
            <span className="text-[11px] text-slate-400 line-through">
              {formatINR(product.price)}
            </span>
          )}
        </div>

        {/* Discount percent */}
        {hasDiscount && (
          <span className="text-[11px] font-bold text-emerald-600 -mt-0.5">
            {discountAmount}% off
          </span>
        )}

        {/* Stock status */}
        {!product.inStock && (
          <span className="text-[10px] font-bold text-rose-500 mt-0.5">Out of stock</span>
        )}

        {/* Add to Cart button */}
        <div className="mt-auto pt-2">
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={!product.inStock || loading}
            className="w-full flex items-center justify-center gap-1.5 bg-[#6938ef] hover:bg-[#5b2ee0] text-white rounded-lg py-2 px-2.5 text-xs font-semibold active:scale-[0.98] transition-all shadow-xs disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShoppingCart className="h-3.5 w-3.5" />}
            <span>{product.inStock ? (loading ? "Adding..." : "Add to Cart") : "Out of Stock"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
