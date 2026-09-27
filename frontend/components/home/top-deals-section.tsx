"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, ShoppingCart, ChevronRight, Check, Star } from "lucide-react";
import { toast } from "sonner";
import { useCartStore } from "@/store/cart-store";
import { useAuthStore } from "@/store/auth-store";
import { addToCart } from "@/services/cart-service";
import { formatINR } from "@/lib/utils";

export interface TopDealItem {
  id: number;
  name: string;
  brand: string;
  price: number;
  originalPrice: number;
  discountPercent: number;
  rating: number;
  reviews: string;
  image: string;
  category: string;
}

// Real mixed-category products matching the reference design and database items
const MIXED_TOP_DEALS: TopDealItem[] = [
  {
    id: 45239,
    name: "iPhone 15 Pro Max (512GB)",
    brand: "APPLE",
    price: 91430,
    originalPrice: 105699,
    discountPercent: 14,
    rating: 4.5,
    reviews: "4.5K",
    image: "/images/products/deals/iphone_15_pro_max.jpg",
    category: "Smartphones",
  },
  {
    id: 24453,
    name: "Men's Casual T-Shirt",
    brand: "PUMA",
    price: 899,
    originalPrice: 1499,
    discountPercent: 40,
    rating: 4.3,
    reviews: "2.1K",
    image: "/images/products/deals/puma_tshirt.jpg",
    category: "Clothing",
  },
  {
    id: 26044,
    name: "Men's Running Shoes",
    brand: "NIKE",
    price: 3999,
    originalPrice: 5599,
    discountPercent: 28,
    rating: 4.4,
    reviews: "3.2K",
    image: "/images/products/deals/nike_shoes.jpg",
    category: "Shoes",
  },
  {
    id: 14812,
    name: "Air Fryer (4.1L)",
    brand: "PHILIPS",
    price: 6499,
    originalPrice: 9999,
    discountPercent: 35,
    rating: 4.2,
    reviews: "1.8K",
    image: "/images/products/deals/philips_air_fryer.jpg",
    category: "Home Appliances",
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
    category: "Audio",
  },
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
    category: "Laptops",
  },
];

export function TopDealsSection() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { setCart, addLocalItem } = useCartStore();
  const [wishlist, setWishlist] = useState<Record<number, boolean>>({});
  const [addingId, setAddingId] = useState<number | null>(null);
  const [activeDot, setActiveDot] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

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

  const handleAddToCart = async (item: TopDealItem, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setAddingId(item.id);
    try {
      if (user) {
        const cart = await addToCart(item.id, 1);
        setCart(cart);
      } else {
        addLocalItem({
          productId: item.id,
          productName: item.name,
          price: item.price,
          image: item.image,
          quantity: 1,
        });
      }
      toast.success(`Added "${item.name}" to cart!`);
    } catch {
      addLocalItem({
        productId: item.id,
        productName: item.name,
        price: item.price,
        image: item.image,
        quantity: 1,
      });
      toast.success(`Added "${item.name}" to cart!`);
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
      const dotIndex = Math.min(4, Math.round(progress * 4));
      setActiveDot(dotIndex);
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

  return (
    <section className="w-full space-y-2.5 pt-1 relative">
      {/* Section Header */}
      <div className="flex items-center justify-between px-0.5">
        <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
          Top Deals for You
        </h2>
        <Link
          href="/deals"
          className="text-xs font-semibold text-[#6938ef] hover:text-[#5527d9] flex items-center transition-colors group"
        >
          <span>See All</span>
          <ChevronRight className="h-3.5 w-3.5 ml-0.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      {/* Horizontal Swipeable Product Carousel Container */}
      <div className="relative w-full">
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="w-full flex items-stretch gap-2.5 sm:gap-3.5 overflow-x-auto hide-scrollbar scroll-smooth snap-x snap-mandatory py-1"
        >
          {MIXED_TOP_DEALS.map((item) => {
            const isWishlisted = !!wishlist[item.id];
            const isAdding = addingId === item.id;

            return (
              <div
                key={item.id}
                onClick={() => router.push(`/products/${item.id}`)}
                className="w-[calc((100%-10px)/2)] min-w-[calc((100%-10px)/2)] sm:w-[calc((100%-28px)/3)] sm:min-w-[calc((100%-28px)/3)] md:w-[calc((100%-42px)/4)] md:min-w-[calc((100%-42px)/4)] lg:w-[calc((100%-56px)/5)] lg:min-w-[calc((100%-56px)/5)] xl:w-[calc((100%-70px)/6)] xl:min-w-[calc((100%-70px)/6)] shrink-0 snap-start bg-white rounded-2xl border border-slate-100/90 shadow-[0_1px_4px_rgba(0,0,0,0.04)] hover:shadow-md hover:border-slate-200 transition-all duration-200 flex flex-col overflow-hidden group cursor-pointer relative select-none"
              >
                {/* Top Row: Discount Badge on Left, Wishlist Heart on Right */}
                <div className="absolute top-2 left-2 right-2 z-20 flex items-center justify-between pointer-events-none">
                  {/* Discount Badge */}
                  <span className="bg-[#ff385c] text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded shadow-xs pointer-events-auto">
                    -{item.discountPercent}%
                  </span>

                  {/* Heart Wishlist Icon */}
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
                <div className="relative w-full h-28 sm:h-32 bg-white flex items-center justify-center p-2 pt-6 shrink-0 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.image}
                    alt={item.name}
                    className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                </div>

                {/* Card Body */}
                <div className="p-2 sm:p-2.5 flex flex-col flex-1 gap-1">
                  {/* Brand */}
                  <span className="text-[10px] font-bold text-[#6938ef] uppercase tracking-wider truncate block">
                    {item.brand}
                  </span>

                  {/* Product Name */}
                  <h3
                    className="text-[11.5px] sm:text-xs font-medium text-slate-900 group-hover:text-[#6938ef] transition-colors line-clamp-2 leading-tight min-h-[2.1rem]"
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
                  <div className="flex items-baseline gap-1 flex-wrap mt-0.5">
                    <span className="text-xs sm:text-sm font-extrabold text-slate-900">
                      {formatINR(item.price)}
                    </span>
                    <span className="text-[10px] text-slate-400 line-through">
                      {formatINR(item.originalPrice)}
                    </span>
                  </div>

                  {/* Discount Line */}
                  <span className="text-[10px] font-bold text-emerald-600 -mt-0.5">
                    {item.discountPercent}% off
                  </span>

                  {/* Purple Add to Cart Button with Cart Icon matching reference */}
                  <div className="mt-auto pt-1.5">
                    <button
                      type="button"
                      onClick={(e) => handleAddToCart(item, e)}
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

        {/* Floating Right Navigation Arrow Button matching Reference Image */}
        <button
          type="button"
          onClick={scrollRight}
          aria-label="Scroll right"
          className="absolute right-1 top-[42%] -translate-y-1/2 z-30 h-8 w-8 rounded-full bg-white/95 backdrop-blur-xs border border-slate-100 shadow-md flex items-center justify-center text-[#6938ef] hover:scale-105 active:scale-90 transition-transform"
        >
          <ChevronRight className="h-4 w-4 stroke-[2.5]" />
        </button>
      </div>

      {/* Carousel Pagination Dots */}
      <div className="flex items-center justify-center gap-1.5 pt-1">
        {[0, 1, 2, 3, 4].map((idx) => (
          <span
            key={idx}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              idx === activeDot ? "w-4 bg-[#6938ef]" : "w-1.5 bg-slate-300"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
