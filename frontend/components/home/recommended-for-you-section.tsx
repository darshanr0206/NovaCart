"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, ChevronRight, Star } from "lucide-react";
import { toast } from "sonner";
import { formatINR } from "@/lib/utils";

interface RecommendedItem {
  id: number;
  name: string;
  brand: string;
  price: number;
  originalPrice: number;
  discountPercent: number;
  rating: number;
  reviews: string;
  image: string;
}

const RECOMMENDED_ITEMS: RecommendedItem[] = [
  {
    id: 16948,
    name: "Vivobook 15 (16GB, 512GB SSD)",
    brand: "ASUS",
    price: 52990,
    originalPrice: 57999,
    discountPercent: 8,
    rating: 4.4,
    reviews: "892",
    image: "/images/products/deals/asus_vivobook.jpg",
  },
  {
    id: 5161,
    name: "Airdopes 141 (Bluetooth 5.3)",
    brand: "BOAT",
    price: 1399,
    originalPrice: 1799,
    discountPercent: 22,
    rating: 4.3,
    reviews: "1.1K",
    image: "/images/products/deals/boat_airdopes.jpg",
  },
];

export function RecommendedForYouSection() {
  const router = useRouter();
  const [wishlist, setWishlist] = useState<Record<number, boolean>>({});

  const toggleWishlist = (id: number, name: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const nextState = !wishlist[id];
    setWishlist((prev) => ({ ...prev, [id]: nextState }));
    if (nextState) {
      toast.success(`Saved "${name}" to Wishlist!`);
    } else {
      toast.info(`Removed from Wishlist`);
    }
  };

  return (
    <section className="w-full space-y-2.5 pt-1">
      {/* Section Header */}
      <div className="flex items-center justify-between px-0.5">
        <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
          Recommended for You
        </h2>
        <Link
          href="/products?sortBy=rating"
          className="text-xs font-semibold text-[#6938ef] hover:text-[#5527d9] flex items-center transition-colors group"
        >
          <span>See All</span>
          <ChevronRight className="h-3.5 w-3.5 ml-0.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      {/* 2-Column Product Grid matching reference image */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-4">
        {RECOMMENDED_ITEMS.map((item) => {
          const isWishlisted = !!wishlist[item.id];

          return (
            <div
              key={item.id}
              onClick={() => router.push(`/products/${item.id}`)}
              className="bg-white rounded-2xl border border-slate-100/90 shadow-[0_1px_4px_rgba(0,0,0,0.03)] hover:shadow-md hover:border-slate-200 transition-all duration-200 flex flex-col overflow-hidden group cursor-pointer relative select-none"
            >
              {/* Top Row: Discount Badge on Left, Wishlist Heart on Right */}
              <div className="absolute top-2 left-2 right-2 z-20 flex items-center justify-between pointer-events-none">
                <span className="bg-[#ff385c] text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded shadow-xs pointer-events-auto">
                  -{item.discountPercent}%
                </span>

                <button
                  type="button"
                  onClick={(e) => toggleWishlist(item.id, item.name, e)}
                  aria-label="Add to wishlist"
                  className="pointer-events-auto h-6 w-6 rounded-full bg-white/70 backdrop-blur-xs flex items-center justify-center text-slate-400 hover:text-rose-500 transition-transform active:scale-90"
                >
                  <Heart
                    className={`h-3.5 w-3.5 stroke-[1.8] ${
                      isWishlisted ? "fill-rose-500 text-rose-500" : ""
                    }`}
                  />
                </button>
              </div>

              {/* Product Image Container */}
              <div className="relative w-full h-32 sm:h-36 bg-white flex items-center justify-center p-3 pt-6 shrink-0 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.image}
                  alt={item.name}
                  className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
              </div>

              {/* Card Body */}
              <div className="p-2.5 sm:p-3 flex flex-col flex-1 gap-1">
                {/* Brand */}
                <span className="text-[10px] font-bold text-[#6938ef] uppercase tracking-wider truncate block">
                  {item.brand}
                </span>

                {/* Product Name */}
                <h3
                  className="text-xs sm:text-[13px] font-medium text-slate-900 group-hover:text-[#6938ef] transition-colors line-clamp-2 leading-tight min-h-[2rem]"
                  title={item.name}
                >
                  {item.name}
                </h3>

                {/* Rating Badge + Review Count */}
                <div className="flex items-center gap-1 mt-0.5">
                  <div className="inline-flex items-center gap-0.5 bg-amber-50 text-amber-900 border border-amber-200/60 px-1 py-0.5 rounded text-[9.5px] font-bold shrink-0">
                    <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400 shrink-0" />
                    <span>{item.rating.toFixed(1)}</span>
                  </div>
                  <span className="text-slate-400 text-[10px] font-normal truncate">
                    ({item.reviews})
                  </span>
                </div>

                {/* Price Row */}
                <div className="flex items-baseline gap-1.5 flex-wrap mt-0.5">
                  <span className="text-xs sm:text-sm font-extrabold text-slate-900">
                    {formatINR(item.price)}
                  </span>
                  <span className="text-[10px] text-slate-400 line-through">
                    {formatINR(item.originalPrice)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
