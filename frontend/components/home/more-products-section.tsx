"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, ShoppingCart, ChevronRight, Check, Star } from "lucide-react";
import { toast } from "sonner";
import { useCartStore } from "@/store/cart-store";
import { useAuthStore } from "@/store/auth-store";
import { addToCart } from "@/services/cart-service";
import { searchProducts } from "@/services/product-service";
import { formatINR } from "@/lib/utils";
import type { Product } from "@/types";

export function MoreProductsSection() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { setCart, addLocalItem } = useCartStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [wishlist, setWishlist] = useState<Record<number, boolean>>({});
  const [addingId, setAddingId] = useState<number | null>(null);
  const [activeDot, setActiveDot] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Fetch top-rated products across all categories — mixed bag for "More Products for You"
    searchProducts({ sortBy: "popularity", sizePage: 12, page: 0 })
      .then((res) => setProducts(res.content ?? []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  const toggleWishlist = (id: number, name: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const next = !wishlist[id];
    setWishlist((prev) => ({ ...prev, [id]: next }));
    toast[next ? "success" : "info"](next ? `Saved "${name}" to Wishlist!` : `Removed from Wishlist`);
  };

  const handleAddToCart = async (product: Product, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setAddingId(product.id);
    try {
      if (user) {
        const cart = await addToCart(product.id, 1);
        setCart(cart);
      } else {
        addLocalItem({
          productId: product.id,
          productName: product.name,
          price: product.effectivePrice,
          image: product.images?.[0] ?? "",
          quantity: 1,
        });
      }
      toast.success(`Added "${product.name}" to cart!`);
    } catch {
      addLocalItem({
        productId: product.id,
        productName: product.name,
        price: product.effectivePrice,
        image: product.images?.[0] ?? "",
        quantity: 1,
      });
      toast.success(`Added "${product.name}" to cart!`);
    } finally {
      setTimeout(() => setAddingId(null), 500);
    }
  };

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      const maxScroll = scrollWidth - clientWidth;
      if (maxScroll <= 0) {
        setActiveDot(0);
        return;
      }
      const progress = scrollLeft / maxScroll;
      setActiveDot(Math.min(4, Math.round(progress * 4)));
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      if (scrollLeft + clientWidth >= scrollWidth - 10) {
        scrollContainerRef.current.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        const cardWidth = scrollContainerRef.current.firstElementChild?.clientWidth || 200;
        scrollContainerRef.current.scrollBy({ left: (cardWidth + 14) * 2, behavior: "smooth" });
      }
    }
  };

  // Badge label: show discount % if high enough, else "Value 365"
  const getBadge = (product: Product): { text: string; bg: string } => {
    if (product.discountPercent >= 20) {
      return { text: `-${product.discountPercent}%`, bg: "bg-[#ff385c]" };
    }
    if (product.discountPercent > 0) {
      return { text: "Value 365", bg: "bg-amber-500" };
    }
    return { text: "Popular", bg: "bg-indigo-500" };
  };

  if (!loading && products.length === 0) return null;

  return (
    <section className="w-full space-y-2.5 pt-1 relative">
      {/* Section Header */}
      <div className="flex items-center justify-between px-0.5">
        <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
          More Products for You
        </h2>
        <Link
          href="/products"
          className="text-xs font-semibold text-[#6938ef] hover:text-[#5527d9] flex items-center transition-colors group"
        >
          <span>See All</span>
          <ChevronRight className="h-3.5 w-3.5 ml-0.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      {/* Skeleton loader */}
      {loading && (
        <div className="flex gap-2.5 sm:gap-3.5 overflow-hidden py-1">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="w-[calc((100%-10px)/2)] min-w-[calc((100%-10px)/2)] sm:w-[calc((100%-28px)/3)] sm:min-w-[calc((100%-28px)/3)] md:w-[calc((100%-42px)/4)] md:min-w-[calc((100%-42px)/4)] lg:w-[calc((100%-56px)/5)] lg:min-w-[calc((100%-56px)/5)] xl:w-[calc((100%-70px)/6)] xl:min-w-[calc((100%-70px)/6)] h-[270px] rounded-2xl bg-slate-100 animate-pulse shrink-0"
            />
          ))}
        </div>
      )}

      {/* Carousel */}
      {!loading && products.length > 0 && (
        <div className="relative w-full">
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="w-full flex items-stretch gap-2.5 sm:gap-3.5 overflow-x-auto hide-scrollbar scroll-smooth snap-x snap-mandatory py-1"
          >
            {products.map((product) => {
              const isWishlisted = !!wishlist[product.id];
              const isAdding = addingId === product.id;
              const image = product.images?.[0] ?? "";
              const brand = product.brand ?? product.sellerName ?? "";
              const badge = getBadge(product);

              return (
                <div
                  key={product.id}
                  onClick={() => router.push(`/products/${product.id}`)}
                  className="w-[calc((100%-10px)/2)] min-w-[calc((100%-10px)/2)] sm:w-[calc((100%-28px)/3)] sm:min-w-[calc((100%-28px)/3)] md:w-[calc((100%-42px)/4)] md:min-w-[calc((100%-42px)/4)] lg:w-[calc((100%-56px)/5)] lg:min-w-[calc((100%-56px)/5)] xl:w-[calc((100%-70px)/6)] xl:min-w-[calc((100%-70px)/6)] shrink-0 snap-start bg-white rounded-2xl border border-slate-100/90 shadow-[0_1px_4px_rgba(0,0,0,0.04)] hover:shadow-md hover:border-slate-200 transition-all duration-200 flex flex-col overflow-hidden group cursor-pointer relative select-none"
                >
                  {/* Top badges row */}
                  <div className="absolute top-2 left-2 right-2 z-20 flex items-center justify-between pointer-events-none">
                    <span
                      className={`${badge.bg} text-white text-[9.5px] font-extrabold px-1.5 py-0.5 rounded shadow-xs pointer-events-auto`}
                    >
                      {badge.text}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => toggleWishlist(product.id, product.name, e)}
                      aria-label="Add to wishlist"
                      className="pointer-events-auto h-6 w-6 rounded-full bg-white/75 backdrop-blur-sm flex items-center justify-center text-slate-400 hover:text-rose-500 transition-transform active:scale-90"
                    >
                      <Heart
                        className={`h-3.5 w-3.5 stroke-[1.8] ${isWishlisted ? "fill-rose-500 text-rose-500" : ""}`}
                      />
                    </button>
                  </div>

                  {/* Product Image */}
                  <div className="relative w-full h-28 sm:h-32 bg-slate-50 flex items-center justify-center p-2 pt-7 shrink-0 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={image}
                      alt={product.name}
                      className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>

                  {/* Card Body */}
                  <div className="p-2 sm:p-2.5 flex flex-col flex-1 gap-1">
                    {/* Brand */}
                    <span className="text-[10px] font-bold text-[#6938ef] uppercase tracking-wider truncate block">
                      {brand}
                    </span>

                    {/* Name */}
                    <h3
                      className="text-[11.5px] sm:text-xs font-medium text-slate-900 group-hover:text-[#6938ef] transition-colors line-clamp-2 leading-tight min-h-[2.1rem]"
                      title={product.name}
                    >
                      {product.name}
                    </h3>

                    {/* Rating */}
                    <div className="flex items-center gap-1 mt-0.5">
                      <div className="inline-flex items-center gap-0.5 bg-amber-50 text-amber-900 border border-amber-200/60 px-1 py-0.5 rounded text-[9.5px] font-bold shrink-0">
                        <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400 shrink-0" />
                        <span>{product.averageRating.toFixed(1)}</span>
                      </div>
                      <span className="text-slate-400 text-[10px] truncate">
                        ({product.reviewCount >= 1000
                          ? `${(product.reviewCount / 1000).toFixed(1)}K`
                          : product.reviewCount})
                      </span>
                    </div>

                    {/* Price Row */}
                    <div className="flex items-baseline gap-1 flex-wrap mt-0.5">
                      <span className="text-xs sm:text-[13px] font-extrabold text-slate-900">
                        {formatINR(product.effectivePrice)}
                      </span>
                      {product.discountPercent > 0 && (
                        <span className="text-[10px] text-slate-400 line-through">
                          {formatINR(product.price)}
                        </span>
                      )}
                    </div>

                    {/* Discount tag */}
                    {product.discountPercent > 0 && (
                      <span className="text-[10px] font-bold text-emerald-600 -mt-0.5">
                        {product.discountPercent}% off
                      </span>
                    )}

                    {/* Add to Cart */}
                    <div className="mt-auto pt-1.5">
                      <button
                        type="button"
                        onClick={(e) => handleAddToCart(product, e)}
                        disabled={isAdding}
                        aria-label="Add to Cart"
                        className="w-full bg-[#6938ef] hover:bg-[#5b2ee0] active:scale-95 text-white font-semibold py-1.5 px-2 rounded-lg text-[11px] transition-all shadow-xs flex items-center justify-center gap-1 disabled:opacity-80"
                      >
                        {isAdding ? (
                          <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                        ) : (
                          <>
                            <ShoppingCart className="h-3 w-3" />
                            <span>Add to Cart</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right scroll arrow */}
          <button
            type="button"
            onClick={scrollRight}
            aria-label="Scroll right"
            className="absolute right-1 top-[42%] -translate-y-1/2 z-30 h-8 w-8 rounded-full bg-white/95 backdrop-blur-sm border border-slate-100 shadow-md flex items-center justify-center text-[#6938ef] hover:scale-105 active:scale-90 transition-transform"
          >
            <ChevronRight className="h-4 w-4 stroke-[2.5]" />
          </button>
        </div>
      )}

      {/* Pagination dots */}
      {!loading && products.length > 0 && (
        <div className="flex items-center justify-center gap-1.5 pt-1">
          {[0, 1, 2, 3, 4].map((idx) => (
            <span
              key={idx}
              className={`h-1.5 rounded-full transition-all duration-300 ${idx === activeDot ? "w-4 bg-[#6938ef]" : "w-1.5 bg-slate-300"}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
